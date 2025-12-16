// src/components/ExperimentPDF.jsx
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const splitTextToWidth = (text, maxWidth, fontSize, font) => {
    if (!text) return [''];
    
    const words = text.toString().split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine === '') {
                let splitWord = '';
                for (const char of word) {
                    const test = splitWord + char;
                    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
                        splitWord = test;
                    } else {
                        lines.push(splitWord);
                        splitWord = char;
                    }
                }
                if (splitWord) lines.push(splitWord);
                currentLine = '';
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
};

const drawTextWithWrap = (page, text, x, y, options) => {
    const { maxWidth, fontSize, font, lineHeight = 15 } = options;
    const lines = splitTextToWidth(text, maxWidth, fontSize, font);
    let currentY = y;
    
    for (const line of lines) {
        if (currentY < 30) break;
        page.drawText(line, { x, y: currentY, size: fontSize, font });
        currentY -= lineHeight;
    }
    
    return currentY;
};

export const generateExperimentPDF = async (experiment) => {
    try {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        const fontBytes = await fetch('/fonts/Roboto/static/Roboto-Regular.ttf')
            .then(res => res.arrayBuffer());

        const font = await pdfDoc.embedFont(fontBytes);
        const page = pdfDoc.addPage([600, 800]);
        const { height } = page.getSize();

        let y = height - 50;

        // Заголовок
        y = drawTextWithWrap(page, 'Лабораторный журнал', 50, y, {
            maxWidth: 500,
            fontSize: 16,
            font,
            lineHeight: 20
        });
        y -= 10;

        y = drawTextWithWrap(page, `Эксперимент #${experiment.experiment_id || ''}`, 50, y, {
            maxWidth: 500,
            fontSize: 12,
            font,
            lineHeight: 15
        });
        y -= 30;

        // Проверка места
        if (y < 50) {
            console.warn('Недостаточно места на странице');
        }

        // Основные поля
        const fields = [
            ['Дата', new Date(experiment.date_conducted).toLocaleDateString('ru-RU')],
            ['Описание', experiment.description || '—'],
            ['Наблюдения', experiment.observations || '—'],
            ['Провёл', experiment.user_full_name || '—'],
        ];

        for (const [label, value] of fields) {
            if (y < 50) break;
            
            // Рисуем метку
            page.drawText(label, { x: 50, y, size: 10, font });
            
            // Рисуем значение с переносом
            y = drawTextWithWrap(page, value, 150, y, {
                maxWidth: 400,
                fontSize: 10,
                font,
                lineHeight: 15
            });
            y -= 10;
        }

        // Реагенты
        if (experiment.reagents?.length > 0 && y > 50) {
            y -= 15;
            y = drawTextWithWrap(page, 'Реагенты:', 50, y, {
                maxWidth: 500,
                fontSize: 12,
                font,
                lineHeight: 15
            });
            y -= 15;

            for (const r of experiment.reagents) {
                if (y < 30) break;
                const text = `${r.name || '—'} — ${r.amount || '0'} ${r.unit || ''}`;
                y = drawTextWithWrap(page, text, 50, y, {
                    maxWidth: 500,
                    fontSize: 10,
                    font,
                    lineHeight: 15
                });
                y -= 10;
            }
        }

        // Сохранение
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `experiment_${experiment.experiment_id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Ошибка PDF:', err);
        alert('Ошибка создания PDF: ' + err.message);
    }
};
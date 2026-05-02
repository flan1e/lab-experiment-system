--
-- PostgreSQL database dump
--

-- Dumped from database version 17.3
-- Dumped by pg_dump version 17.3

-- Started on 2026-05-02 16:58:15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 24705)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5032 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 297 (class 1255 OID 24742)
-- Name: activate_user(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.activate_user(p_admin_id integer, p_user_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT role_id INTO admin_role FROM users WHERE user_id = p_admin_id;
    IF admin_role != '3' THEN
        RAISE EXCEPTION 'Только админ может активировать пользователей';
    END IF;

    UPDATE users SET is_active = true WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION public.activate_user(p_admin_id integer, p_user_id integer) OWNER TO postgres;

--
-- TOC entry 292 (class 1255 OID 24794)
-- Name: add_assignment(text, text, text, integer[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_assignment(p_title text, p_description text, p_instructions text DEFAULT NULL::text, p_reagent_ids integer[] DEFAULT NULL::integer[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id INTEGER;
BEGIN
    INSERT INTO assignments (title, description, instructions)
    VALUES (p_title, p_description, p_instructions)
    RETURNING assignment_id INTO new_id;

    IF p_reagent_ids IS NOT NULL THEN
        INSERT INTO assignment_reagents (assignment_id, reagent_id)
        SELECT new_id, UNNEST(p_reagent_ids);
    END IF;

    RETURN new_id;
END;
$$;


ALTER FUNCTION public.add_assignment(p_title text, p_description text, p_instructions text, p_reagent_ids integer[]) OWNER TO postgres;

--
-- TOC entry 290 (class 1255 OID 16628)
-- Name: add_experiment(integer, date, text, text, integer[], numeric[], text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_experiment(p_user_id integer, p_date_conducted date, p_description text, p_observations text, p_reagent_ids integer[], p_amounts numeric[], p_units text[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_experiment_id INTEGER;
    i INTEGER;
BEGIN
    EXECUTE 'SET LOCAL app.current_user_id = ' || p_user_id;

    IF p_date_conducted > CURRENT_DATE THEN
        RAISE EXCEPTION 'Дата проведения не может быть в будущем';
    END IF;

    IF p_description IS NULL OR TRIM(p_description) = '' THEN
        RAISE EXCEPTION 'Описание обязательно';
    END IF;

    IF array_length(p_reagent_ids, 1) IS NULL OR 
       array_length(p_amounts, 1) IS NULL OR 
       array_length(p_units, 1) IS NULL THEN
        RAISE EXCEPTION 'Должен быть хотя бы один реагент';
    END IF;

    IF array_length(p_reagent_ids, 1) != array_length(p_amounts, 1) OR
       array_length(p_reagent_ids, 1) != array_length(p_units, 1) THEN
        RAISE EXCEPTION 'Массивы реагентов, количеств и единиц должны совпадать по длине';
    END IF;

    IF EXISTS (
        SELECT 1 FROM unnest(p_reagent_ids) AS rid
        WHERE NOT EXISTS (SELECT 1 FROM reagents WHERE reagent_id = rid)
    ) THEN
        RAISE EXCEPTION 'Один или несколько реагентов не существуют';
    END IF;

    FOR i IN 1..array_length(p_amounts, 1) LOOP
        IF p_amounts[i] <= 0 THEN
            RAISE EXCEPTION 'Количество должно быть положительным';
        END IF;
    END LOOP;

    FOR i IN 1..array_length(p_units, 1) LOOP
        IF p_units[i] NOT IN ('г', 'мл') THEN
            RAISE EXCEPTION 'Недопустимая единица измерения: %', p_units[i];
        END IF;
    END LOOP;

    INSERT INTO experiments (date_conducted, description, observations, user_id)
    VALUES (p_date_conducted, p_description, p_observations, p_user_id)
    RETURNING experiment_id INTO new_experiment_id;

    -- Добавление реагентов
    FOR i IN 1..array_length(p_reagent_ids, 1) LOOP
        INSERT INTO experiment_reagents (experiment_id, reagent_id, amount, unit)
        VALUES (new_experiment_id, p_reagent_ids[i], p_amounts[i], p_units[i]);
    END LOOP;

    RETURN new_experiment_id;
END;
$$;


ALTER FUNCTION public.add_experiment(p_user_id integer, p_date_conducted date, p_description text, p_observations text, p_reagent_ids integer[], p_amounts numeric[], p_units text[]) OWNER TO postgres;

--
-- TOC entry 265 (class 1255 OID 24748)
-- Name: add_experiment(integer, date, text, text, text, integer[], numeric[], text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_experiment(p_user_id integer, p_date_conducted date, p_theme text, p_description text, p_observations text, p_reagent_ids integer[], p_amounts numeric[], p_units text[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_experiment_id INTEGER;
    i INTEGER;
BEGIN
    EXECUTE 'SET LOCAL app.current_user_id = ' || p_user_id;

    IF p_date_conducted > CURRENT_DATE THEN
        RAISE EXCEPTION 'Дата проведения не может быть в будущем';
    END IF;

    IF p_theme IS NULL OR TRIM(p_theme) = '' THEN
        RAISE EXCEPTION 'Тема работы обязательна';
    END IF;

    IF p_description IS NULL OR TRIM(p_description) = '' THEN
        RAISE EXCEPTION 'Описание обязательно';
    END IF;

    IF array_length(p_reagent_ids, 1) IS NULL OR 
       array_length(p_amounts, 1) IS NULL OR 
       array_length(p_units, 1) IS NULL THEN
        RAISE EXCEPTION 'Должен быть хотя бы один реагент';
    END IF;

    IF array_length(p_reagent_ids, 1) != array_length(p_amounts, 1) OR
       array_length(p_reagent_ids, 1) != array_length(p_units, 1) THEN
        RAISE EXCEPTION 'Массивы реагентов, количеств и единиц должны совпадать по длине';
    END IF;

    IF EXISTS (
        SELECT 1 FROM unnest(p_reagent_ids) AS rid
        WHERE NOT EXISTS (SELECT 1 FROM reagents WHERE reagent_id = rid)
    ) THEN
        RAISE EXCEPTION 'Один или несколько реагентов не существуют';
    END IF;

    FOR i IN 1..array_length(p_amounts, 1) LOOP
        IF p_amounts[i] <= 0 THEN
            RAISE EXCEPTION 'Количество должно быть положительным';
        END IF;
    END LOOP;

    FOR i IN 1..array_length(p_units, 1) LOOP
        IF p_units[i] NOT IN ('г', 'мл') THEN
            RAISE EXCEPTION 'Недопустимая единица измерения: %', p_units[i];
        END IF;
    END LOOP;

    INSERT INTO experiments (
        date_conducted, 
        theme,                
        description, 
        observations, 
        user_id
    )
    VALUES (
        p_date_conducted, 
        TRIM(p_theme),        
        p_description, 
        p_observations, 
        p_user_id
    )
    RETURNING experiment_id INTO new_experiment_id;

    FOR i IN 1..array_length(p_reagent_ids, 1) LOOP
        INSERT INTO experiment_reagents (experiment_id, reagent_id, amount, unit)
        VALUES (new_experiment_id, p_reagent_ids[i], p_amounts[i], p_units[i]);
    END LOOP;

    RETURN new_experiment_id;
END;
$$;


ALTER FUNCTION public.add_experiment(p_user_id integer, p_date_conducted date, p_theme text, p_description text, p_observations text, p_reagent_ids integer[], p_amounts numeric[], p_units text[]) OWNER TO postgres;

--
-- TOC entry 266 (class 1255 OID 24632)
-- Name: add_new_user(text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_new_user(p_creator_role text, p_username text, p_password_hash text, p_full_name text, p_target_role text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_user_id INTEGER;
    target_role_id INTEGER;
    parts TEXT[];
    ln TEXT;
    fn TEXT;
    mn TEXT;
BEGIN
    -- Разбор ФИО: фамилия, имя, отчество
    parts := STRING_TO_ARRAY(TRIM(p_full_name), ' ');
    IF array_length(parts, 1) < 1 THEN
        RAISE EXCEPTION 'Поле "ФИО" не может быть пустым';
    END IF;

    -- Присваиваем части
    ln := parts[1];
    fn := COALESCE(parts[2], '');
    mn := COALESCE(parts[3], '');


    IF p_creator_role = 'teacher' AND p_target_role != 'student' THEN
        RAISE EXCEPTION 'Преподаватель может создавать только студентов';
    END IF;
    IF p_creator_role = 'student' THEN
        RAISE EXCEPTION 'Студент не может создавать пользователей';
    END IF;

    SELECT role_id INTO target_role_id FROM roles WHERE role_name = p_target_role;
    IF target_role_id IS NULL THEN
        RAISE EXCEPTION 'Роль "%" не существует', p_target_role;
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        RAISE EXCEPTION 'Пользователь с логином "%" уже существует', p_username;
    END IF;

    INSERT INTO users (
        username, 
        password_hash, 
        last_name, 
        first_name, 
        middle_name, 
        role_id,
        is_active
    ) VALUES (
        p_username,
        p_password_hash,
        ln,
        fn,
        mn,
        target_role_id,
        true
    )
    RETURNING user_id INTO new_user_id;

    INSERT INTO audit_log (operation, table_name, record_id, user_id, details, timestamp)
    VALUES (
        'CREATE_USER',
        'users',
        new_user_id,
        current_setting('app.current_user_id')::INTEGER,
        'Создан пользователь ' || p_username || ' (роль: ' || p_target_role || ')',
        NOW()
    );
END;
$$;


ALTER FUNCTION public.add_new_user(p_creator_role text, p_username text, p_password_hash text, p_full_name text, p_target_role text) OWNER TO postgres;

--
-- TOC entry 298 (class 1255 OID 24670)
-- Name: add_new_user(integer, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_new_user(p_creator_id integer, p_creator_role text, p_username text, p_password_hash text, p_full_name text, p_target_role text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_user_id INTEGER;
BEGIN
    EXECUTE 'SET LOCAL app.current_user_id = ' || p_creator_id;

    IF p_creator_role = 'teacher' AND p_target_role != 'student' THEN
        RAISE EXCEPTION 'Преподаватель может создавать только студентов';
    END IF;
    IF p_creator_role = 'student' THEN
        RAISE EXCEPTION 'Студент не может создавать пользователей';
    END IF;
    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        RAISE EXCEPTION 'Пользователь с логином "%" уже существует', p_username;
    END IF;

	INSERT INTO users (
    username, password_hash, last_name, first_name, middle_name, role_id, is_active
) VALUES (
    p_username,
    p_password_hash,
    ln, fn, mn, target_role_id, true
)
	RETURNING user_id INTO new_user_id;

    INSERT INTO audit_log (operation, table_name, record_id, user_id, details, timestamp)
    VALUES (
        'CREATE_USER',
        'users',
        new_user_id,
        p_creator_id,  
        'Создан пользователь: ' || p_username || ' (роль: ' || p_target_role || ')',
        NOW()
    );
END;
$$;


ALTER FUNCTION public.add_new_user(p_creator_id integer, p_creator_role text, p_username text, p_password_hash text, p_full_name text, p_target_role text) OWNER TO postgres;

--
-- TOC entry 295 (class 1255 OID 24814)
-- Name: add_new_user(text, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_new_user(p_creator_role text, p_username text, p_password_hash text, p_last_name text, p_first_name text, p_middle_name text, p_target_role text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_user_id INTEGER;
    target_role_id INTEGER;
BEGIN
    IF p_creator_role NOT IN ('admin', 'teacher') THEN
        RAISE EXCEPTION 'Только администратор или преподаватель могут создавать пользователей';
    END IF;

    SELECT role_id INTO target_role_id FROM roles WHERE role_name = p_target_role;
    IF target_role_id IS NULL THEN
        RAISE EXCEPTION 'Роль "%" не существует', p_target_role;
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        RAISE EXCEPTION 'Пользователь с логином "%" уже существует', p_username;
    END IF;

    INSERT INTO users (
        username, 
        password_hash, 
        last_name, 
        first_name, 
        middle_name, 
        role_id,
        is_active
    ) VALUES (
        p_username,
        p_password_hash,
        p_last_name,
        p_first_name,
        p_middle_name,
        target_role_id,
        true
    )
    RETURNING user_id INTO new_user_id;

    RETURN new_user_id;
END;
$$;


ALTER FUNCTION public.add_new_user(p_creator_role text, p_username text, p_password_hash text, p_last_name text, p_first_name text, p_middle_name text, p_target_role text) OWNER TO postgres;

--
-- TOC entry 307 (class 1255 OID 24697)
-- Name: add_or_update_review(integer, integer, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_or_update_review(p_experiment_id integer, p_reviewer_id integer, p_rating integer, p_comment text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    reviewer_role TEXT;
    existing_review_id INTEGER;
    operation_type TEXT;
BEGIN
    SELECT r.role_name INTO reviewer_role FROM users u JOIN roles r on u.role_id = r.role_id 
	WHERE user_id = p_reviewer_id;
    IF reviewer_role != 'teacher' AND reviewer_role != 'admin' THEN
        RAISE EXCEPTION 'Только преподаватели и администраторы могут ставить оценки';
    END IF;

    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Оценка должна быть от 1 до 5';
    END IF;

    SELECT review_id INTO existing_review_id 
    FROM experiment_reviews 
    WHERE experiment_id = p_experiment_id;

    IF existing_review_id IS NULL THEN
        operation_type := 'CREATE_REVIEW';
        INSERT INTO experiment_reviews (experiment_id, reviewer_id, rating, comment)
        VALUES (p_experiment_id, p_reviewer_id, p_rating, p_comment);
    ELSE
        operation_type := 'UPDATE_REVIEW';
        UPDATE experiment_reviews
        SET 
            reviewer_id = p_reviewer_id,
            rating = p_rating,
            comment = p_comment,
            created_at = NOW()
        WHERE experiment_id = p_experiment_id;
    END IF;

    INSERT INTO audit_log (operation, table_name, record_id, user_id, details, timestamp)
    VALUES (
        operation_type,
        'experiment_reviews',
        p_experiment_id,
        p_reviewer_id,
        'Оценка эксперимента ' || p_experiment_id || ': ' || p_rating || ' ⭐',
        NOW()
    );
END;
$$;


ALTER FUNCTION public.add_or_update_review(p_experiment_id integer, p_reviewer_id integer, p_rating integer, p_comment text) OWNER TO postgres;

--
-- TOC entry 288 (class 1255 OID 24703)
-- Name: deactivate_user(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.deactivate_user(p_admin_id integer, p_target_user_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT role_id INTO admin_role FROM users WHERE user_id = p_admin_id;
    IF admin_role != '3' THEN
        RAISE EXCEPTION 'Только администратор может деактивировать пользователей';
    END IF;

    IF p_admin_id = p_target_user_id THEN
        RAISE EXCEPTION 'Нельзя деактивировать самого себя';
    END IF;

    UPDATE users 
    SET is_active = false 
    WHERE user_id = p_target_user_id;
END;
$$;


ALTER FUNCTION public.deactivate_user(p_admin_id integer, p_target_user_id integer) OWNER TO postgres;

--
-- TOC entry 294 (class 1255 OID 24797)
-- Name: delete_assignment(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_assignment(p_assignment_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM assignments WHERE assignment_id = p_assignment_id;
END;
$$;


ALTER FUNCTION public.delete_assignment(p_assignment_id integer) OWNER TO postgres;

--
-- TOC entry 263 (class 1255 OID 16630)
-- Name: delete_experiment(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_experiment(p_user_id integer, p_experiment_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    experiment_owner INTEGER;
    current_user_role TEXT;          
BEGIN
    EXECUTE 'SET LOCAL app.current_user_id = ' || p_user_id;

    SELECT e.user_id
    FROM experiments e
    WHERE e.experiment_id = p_experiment_id
    INTO experiment_owner;

    SELECT u.role_id
    FROM users u
    WHERE u.user_id = p_user_id
    INTO current_user_role;

    IF current_user_role = '1' AND experiment_owner != p_user_id THEN
        RAISE EXCEPTION 'Студент может удалять только свои эксперименты';
    END IF;

    DELETE FROM experiments WHERE experiment_id = p_experiment_id;
END;
$$;


ALTER FUNCTION public.delete_experiment(p_user_id integer, p_experiment_id integer) OWNER TO postgres;

--
-- TOC entry 291 (class 1255 OID 24743)
-- Name: generate_statistics_report(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_statistics_report() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    report_text TEXT := '';
    user_rec RECORD;
    reagent_rec RECORD;
    
    total_experiments BIGINT;
    active_users BIGINT;
    inactive_users BIGINT;
    
    -- Курсор для пользователей
    user_cursor CURSOR FOR 
        SELECT 
    		u.last_name || ' ' || u.first_name || COALESCE(' ' || u.middle_name, '') AS full_name,
            r.role_name,
            u.is_active,
            COUNT(e.experiment_id) as exp_count
        FROM users u JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN experiments e ON e.user_id = u.user_id
        GROUP BY u.user_id, u.last_name, r.role_name, u.is_active
        ORDER BY exp_count DESC;
    
    -- Курсор для реагентов
    reagent_cursor CURSOR FOR
        SELECT 
            r.name,
            COUNT(er.reagent_id) as usage_count
        FROM reagents r
        LEFT JOIN experiment_reagents er ON er.reagent_id = r.reagent_id
        GROUP BY r.reagent_id, r.name
        ORDER BY usage_count DESC
        LIMIT 3;
BEGIN
    report_text := report_text || 'Отчёт по статистике лабораторного журнала' || E'\n';
    report_text := report_text || '=========================================' || E'\n';
    report_text := report_text || 'Дата формирования: ' || NOW()::TEXT || E'\n\n';

    SELECT COUNT(*) INTO total_experiments FROM experiments;
    SELECT COUNT(*) INTO active_users FROM users WHERE is_active = true;
    SELECT COUNT(*) INTO inactive_users FROM users WHERE is_active = false;
    
    report_text := report_text || 'Общая статистика:' || E'\n';
    report_text := report_text || '-----------------' || E'\n';
    report_text := report_text || 'Всего экспериментов: ' || total_experiments || E'\n';
    report_text := report_text || 'Активных пользователей: ' || active_users || E'\n';
    report_text := report_text || 'Неактивных пользователей: ' || inactive_users || E'\n\n';

    report_text := report_text || 'Статистика по пользователям:' || E'\n';
    report_text := report_text || '----------------------------' || E'\n';
    
    OPEN user_cursor;
    LOOP
        FETCH user_cursor INTO user_rec;
        EXIT WHEN NOT FOUND;
        
        report_text := report_text || 
            user_rec.full_name || ' (' || 
            user_rec.role_name || ', ' ||
            CASE WHEN user_rec.is_active THEN 'активен' ELSE 'неактивен' END || 
            '): ' || user_rec.exp_count || ' экспериментов' || E'\n';
    END LOOP;
    CLOSE user_cursor;
    report_text := report_text || E'\n';

    report_text := report_text || 'Топ-3 реагента:' || E'\n';
    report_text := report_text || '---------------' || E'\n';
    
    OPEN reagent_cursor;
    LOOP
        FETCH reagent_cursor INTO reagent_rec;
        EXIT WHEN NOT FOUND;
        
        report_text := report_text || 
            reagent_rec.name || ': ' || reagent_rec.usage_count || ' использований' || E'\n';
    END LOOP;
    CLOSE reagent_cursor;

    RETURN report_text;
END;
$$;


ALTER FUNCTION public.generate_statistics_report() OWNER TO postgres;

--
-- TOC entry 305 (class 1255 OID 24823)
-- Name: get_assignment_by_id(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_assignment_by_id(p_assignment_id integer) RETURNS TABLE(assignment_id integer, title text, description text, instructions text, is_active boolean, reagents json, attachments json)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.assignment_id,
        a.title,
        a.description,
        a.instructions,
        a.is_active,
        COALESCE((
            SELECT json_agg(json_build_object('id', r.reagent_id, 'name', r.name) ORDER BY r.reagent_id)
            FROM assignment_reagents ar2
            JOIN reagents r ON ar2.reagent_id = r.reagent_id
            WHERE ar2.assignment_id = a.assignment_id
        ), '[]'::JSON) AS reagents,
        COALESCE((
            SELECT json_agg(json_build_object('name', att.file_name, 'type', att.file_type, 'path', att.file_path) ORDER BY att.attachment_id)
            FROM assignment_attachments att
            WHERE att.assignment_id = a.assignment_id
        ), '[]'::JSON) AS attachments
    FROM assignments a
    WHERE a.assignment_id = p_assignment_id;
END;
$$;


ALTER FUNCTION public.get_assignment_by_id(p_assignment_id integer) OWNER TO postgres;

--
-- TOC entry 304 (class 1255 OID 24822)
-- Name: get_assignments(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_assignments(p_user_role text) RETURNS TABLE(assignment_id integer, title text, description text, instructions text, is_active boolean, reagents json, attachments json)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.assignment_id,
        a.title,
        a.description,
        a.instructions,
        a.is_active,
        COALESCE((
            SELECT json_agg(json_build_object('id', r.reagent_id, 'name', r.name) ORDER BY r.reagent_id)
            FROM assignment_reagents ar2
            JOIN reagents r ON ar2.reagent_id = r.reagent_id
            WHERE ar2.assignment_id = a.assignment_id
        ), '[]'::JSON) AS reagents,
        COALESCE((
            SELECT json_agg(json_build_object('name', att.file_name, 'type', att.file_type, 'path', att.file_path) ORDER BY att.attachment_id)
            FROM assignment_attachments att
            WHERE att.assignment_id = a.assignment_id
        ), '[]'::JSON) AS attachments
    FROM assignments a
    WHERE 
        (p_user_role = 'student' AND a.is_active = true)
        OR p_user_role IN ('teacher', 'admin')
    ORDER BY a.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_assignments(p_user_role text) OWNER TO postgres;

--
-- TOC entry 299 (class 1255 OID 24820)
-- Name: get_experiment_by_id(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_experiment_by_id(p_experiment_id integer) RETURNS TABLE(experiment_id integer, theme text, date_conducted date, description text, observations text, last_name text, first_name text, middle_name text, user_id integer, reagents json)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.experiment_id,
        e.theme,
        e.date_conducted,
        e.description,
        e.observations,
        u.last_name,
        u.first_name,
        u.middle_name,
        e.user_id,
        json_agg(json_build_object(
            'reagent_id', r.reagent_id,
            'name', r.name,
            'amount', er.amount,
            'unit', er.unit
        )) FILTER (WHERE r.name IS NOT NULL) AS reagents
    FROM experiments e
    JOIN users u ON u.user_id = e.user_id
    LEFT JOIN experiment_reagents er ON er.experiment_id = e.experiment_id
    LEFT JOIN reagents r ON r.reagent_id = er.reagent_id
    WHERE e.experiment_id = p_experiment_id
    GROUP BY e.experiment_id, u.last_name, u.first_name, u.middle_name, e.user_id, e.theme;
END;
$$;


ALTER FUNCTION public.get_experiment_by_id(p_experiment_id integer) OWNER TO postgres;

--
-- TOC entry 302 (class 1255 OID 24821)
-- Name: get_experiments(integer, date, date, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_experiments(p_filter_user_id integer, p_filter_date_from date, p_filter_date_to date, p_filter_reagent_id integer) RETURNS TABLE(experiment_id integer, theme text, date_conducted date, description text, observations text, last_name text, first_name text, middle_name text, user_id integer, reagents json)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.experiment_id,
        e.theme,
        e.date_conducted,
        e.description,
        e.observations,
        u.last_name,
        u.first_name,
        u.middle_name,
        e.user_id,
        json_agg(json_build_object(
            'name', r.name,
            'amount', er.amount,
            'unit', er.unit
        )) FILTER (WHERE r.name IS NOT NULL) AS reagents
    FROM experiments e
    JOIN users u ON u.user_id = e.user_id
    LEFT JOIN experiment_reagents er ON er.experiment_id = e.experiment_id
    LEFT JOIN reagents r ON r.reagent_id = er.reagent_id
    WHERE (p_filter_user_id IS NULL OR e.user_id = p_filter_user_id)
      AND (p_filter_date_from IS NULL OR e.date_conducted >= p_filter_date_from)
      AND (p_filter_date_to IS NULL OR e.date_conducted <= p_filter_date_to)
      AND (p_filter_reagent_id IS NULL OR e.experiment_id IN (
          SELECT er.experiment_id FROM experiment_reagents er WHERE er.reagent_id = p_filter_reagent_id
      ))
    GROUP BY e.experiment_id, u.last_name, u.first_name, u.middle_name, e.user_id, e.theme;
END;
$$;


ALTER FUNCTION public.get_experiments(p_filter_user_id integer, p_filter_date_from date, p_filter_date_to date, p_filter_reagent_id integer) OWNER TO postgres;

--
-- TOC entry 300 (class 1255 OID 24818)
-- Name: get_statistics(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_statistics() RETURNS TABLE(total_experiments bigint, last_name text, first_name text, middle_name text, role_name text, experiments_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM experiments) AS total_experiments,
        u.last_name,
        u.first_name,
        u.middle_name,
        r.role_name,
        COUNT(e.experiment_id) AS experiments_count
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN experiments e ON e.user_id = u.user_id
    GROUP BY u.user_id, u.last_name, u.first_name, u.middle_name, r.role_name
    ORDER BY experiments_count DESC;
END;
$$;


ALTER FUNCTION public.get_statistics() OWNER TO postgres;

--
-- TOC entry 303 (class 1255 OID 24819)
-- Name: get_students_grades(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_students_grades() RETURNS TABLE(student_id integer, last_name text, first_name text, middle_name text, average_rating numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.user_id,
        u.last_name,
        u.first_name,
        u.middle_name,
        ROUND(AVG(rv.rating), 2)
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    JOIN experiments e ON u.user_id = e.user_id
    JOIN experiment_reviews rv ON e.experiment_id = rv.experiment_id
    WHERE r.role_name = 'student'
    GROUP BY u.user_id, u.last_name, u.first_name, u.middle_name
    ORDER BY average_rating DESC NULLS LAST;
END;
$$;


ALTER FUNCTION public.get_students_grades() OWNER TO postgres;

--
-- TOC entry 308 (class 1255 OID 24825)
-- Name: get_students_grades_detailed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_students_grades_detailed() RETURNS TABLE(student_id integer, last_name text, first_name text, middle_name text, average_rating numeric, experiments json)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.user_id AS student_id,
        u.last_name,
        u.first_name,
        u.middle_name,
        ROUND(AVG(r.rating), 2) AS average_rating,
        COALESCE(
            json_agg(
                json_build_object(
                    'experiment_id', e.experiment_id,
                    'theme', e.theme,
                    'date_conducted', e.date_conducted,
                    'rating', r.rating,
                    'comment', r.comment
                ) ORDER BY e.date_conducted DESC
            ) FILTER (WHERE e.experiment_id IS NOT NULL),
            '[]'::JSON
        ) AS experiments
    FROM users u
    JOIN roles ro ON u.role_id = ro.role_id
    LEFT JOIN experiments e ON u.user_id = e.user_id
    LEFT JOIN experiment_reviews r ON e.experiment_id = r.experiment_id
    WHERE ro.role_name = 'student'
    GROUP BY u.user_id, u.last_name, u.first_name, u.middle_name
    ORDER BY average_rating DESC NULLS LAST;
END;
$$;


ALTER FUNCTION public.get_students_grades_detailed() OWNER TO postgres;

--
-- TOC entry 309 (class 1255 OID 24826)
-- Name: get_students_grades_detailed(text, numeric, numeric, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_students_grades_detailed(p_search text DEFAULT NULL::text, p_min_rating numeric DEFAULT NULL::numeric, p_max_rating numeric DEFAULT NULL::numeric, p_sort_by text DEFAULT 'average_rating'::text, p_sort_order text DEFAULT 'DESC'::text) RETURNS TABLE(student_id integer, last_name text, first_name text, middle_name text, average_rating numeric, experiments json)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.user_id AS student_id,
        u.last_name,
        u.first_name,
        u.middle_name,
        COALESCE(ROUND(AVG(r.rating), 2), 0) AS average_rating,
        COALESCE(
            json_agg(
                json_build_object(
                    'experiment_id', e.experiment_id,
                    'theme', e.theme,
                    'date_conducted', e.date_conducted,
                    'rating', r.rating,
                    'comment', r.comment
                ) ORDER BY e.date_conducted DESC
            ) FILTER (WHERE e.experiment_id IS NOT NULL),
            '[]'::JSON
        ) AS experiments
    FROM users u
    JOIN roles ro ON u.role_id = ro.role_id
    LEFT JOIN experiments e ON u.user_id = e.user_id
    LEFT JOIN experiment_reviews r ON e.experiment_id = r.experiment_id
    WHERE ro.role_name = 'student'
      AND (
          p_search IS NULL 
          OR LOWER(u.last_name) LIKE LOWER('%' || p_search || '%')
          OR LOWER(u.first_name) LIKE LOWER('%' || p_search || '%')
          OR LOWER(u.middle_name) LIKE LOWER('%' || p_search || '%')
      )
    GROUP BY u.user_id, u.last_name, u.first_name, u.middle_name
    HAVING 
        (p_min_rating IS NULL OR COALESCE(ROUND(AVG(r.rating), 2), 0) >= p_min_rating)
        AND (p_max_rating IS NULL OR COALESCE(ROUND(AVG(r.rating), 2), 0) <= p_max_rating)
    ORDER BY
        CASE WHEN p_sort_by = 'last_name' AND p_sort_order = 'ASC' THEN u.last_name END ASC,
        CASE WHEN p_sort_by = 'last_name' AND p_sort_order = 'DESC' THEN u.last_name END DESC,
        CASE WHEN p_sort_by = 'average_rating' AND p_sort_order = 'ASC' THEN COALESCE(ROUND(AVG(r.rating), 2), 0) END ASC,
        CASE WHEN p_sort_by = 'average_rating' AND p_sort_order = 'DESC' THEN COALESCE(ROUND(AVG(r.rating), 2), 0) END DESC,
        u.user_id;
END;
$$;


ALTER FUNCTION public.get_students_grades_detailed(p_search text, p_min_rating numeric, p_max_rating numeric, p_sort_by text, p_sort_order text) OWNER TO postgres;

--
-- TOC entry 296 (class 1255 OID 24816)
-- Name: get_user_by_id(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_by_id(p_user_id integer) RETURNS TABLE(user_id integer, username text, last_name text, first_name text, middle_name text, role_name text, is_active boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.username,
        u.last_name,
        u.first_name,
        u.middle_name,
        r.role_name,
        u.is_active
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = p_user_id;
END;
$$;


ALTER FUNCTION public.get_user_by_id(p_user_id integer) OWNER TO postgres;

--
-- TOC entry 264 (class 1255 OID 24649)
-- Name: log_audit(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_audit() RETURNS trigger
    LANGUAGE plpgsql
    AS $$DECLARE
    v_user_id INTEGER;
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id')::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    INSERT INTO audit_log (operation, table_name, record_id, user_id, timestamp)
    VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(OLD.experiment_id, NEW.experiment_id),
        v_user_id,
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.log_audit() OWNER TO postgres;

--
-- TOC entry 293 (class 1255 OID 24796)
-- Name: update_assignment(integer, text, text, text, boolean, integer[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_assignment(p_assignment_id integer, p_title text, p_description text, p_instructions text, p_is_active boolean, p_reagent_ids integer[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE assignments 
    SET 
        title = p_title,
        description = p_description,
        instructions = p_instructions,
        is_active = p_is_active,
        updated_at = NOW()
    WHERE assignment_id = p_assignment_id;

    DELETE FROM assignment_reagents WHERE assignment_id = p_assignment_id;
    IF p_reagent_ids IS NOT NULL THEN
        INSERT INTO assignment_reagents (assignment_id, reagent_id)
        SELECT p_assignment_id, UNNEST(p_reagent_ids);
    END IF;
END;
$$;


ALTER FUNCTION public.update_assignment(p_assignment_id integer, p_title text, p_description text, p_instructions text, p_is_active boolean, p_reagent_ids integer[]) OWNER TO postgres;

--
-- TOC entry 267 (class 1255 OID 16629)
-- Name: update_experiment(integer, integer, date, text, text, integer[], numeric[], text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_experiment(p_user_id integer, p_experiment_id integer, p_date_conducted date, p_description text, p_observations text, p_reagent_ids integer[], p_amounts numeric[], p_units text[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    experiment_owner INTEGER;
    current_user_role TEXT;
    i INTEGER;
BEGIN
    EXECUTE 'SET LOCAL app.current_user_id = ' || p_user_id;

    SELECT e.user_id
    FROM experiments e
    WHERE e.experiment_id = p_experiment_id
    INTO experiment_owner;

    SELECT r.role_name
    FROM users u JOIN roles r on u.role_id = r.role_id
    WHERE u.user_id = p_user_id
    INTO current_user_role;

    IF current_user_role = 'student' AND experiment_owner != p_user_id THEN
        RAISE EXCEPTION 'Студент может редактировать только свои эксперименты';
    END IF;

    UPDATE experiments
    SET 
        date_conducted = p_date_conducted,
        description = p_description,
        observations = p_observations
    WHERE experiment_id = p_experiment_id;

    DELETE FROM experiment_reagents WHERE experiment_id = p_experiment_id;

    FOR i IN 1..array_length(p_reagent_ids, 1) LOOP
        INSERT INTO experiment_reagents (experiment_id, reagent_id, amount, unit)
        VALUES (p_experiment_id, p_reagent_ids[i], p_amounts[i], p_units[i]);
    END LOOP;
END;
$$;


ALTER FUNCTION public.update_experiment(p_user_id integer, p_experiment_id integer, p_date_conducted date, p_description text, p_observations text, p_reagent_ids integer[], p_amounts numeric[], p_units text[]) OWNER TO postgres;

--
-- TOC entry 289 (class 1255 OID 24704)
-- Name: update_user(integer, integer, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user(p_admin_id integer, p_target_user_id integer, p_full_name text, p_role text, p_new_password text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT role INTO admin_role FROM users WHERE user_id = p_admin_id;
    IF admin_role != 'admin' THEN
        RAISE EXCEPTION 'Только администратор может редактировать пользователей';
    END IF;

    IF p_admin_id = p_target_user_id THEN
        RAISE EXCEPTION 'Нельзя редактировать самого себя';
    END IF;

    UPDATE users 
    SET 
        full_name = p_full_name,
        role = p_role,
        password_hash = CASE 
            WHEN p_new_password IS NOT NULL 
            THEN crypt(p_new_password, gen_salt('bf')) 
            ELSE password_hash 
        END
    WHERE user_id = p_target_user_id;
END;
$$;


ALTER FUNCTION public.update_user(p_admin_id integer, p_target_user_id integer, p_full_name text, p_role text, p_new_password text) OWNER TO postgres;

--
-- TOC entry 306 (class 1255 OID 24824)
-- Name: update_user(integer, integer, text, text, text, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user(p_admin_id integer, p_target_user_id integer, p_last_name text, p_first_name text, p_middle_name text, p_role_id integer, p_new_password text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT u.role_id INTO admin_role FROM users u WHERE u.user_id = p_admin_id;
    IF admin_role != '3' THEN
        RAISE EXCEPTION 'Только администратор может редактировать пользователей';
    END IF;

    -- IF p_admin_id = p_target_user_id THEN
    --     RAISE EXCEPTION 'Нельзя редактировать самого себя';
    -- END IF;

    IF NOT EXISTS (SELECT 1 FROM roles WHERE role_id = p_role_id) THEN
        RAISE EXCEPTION 'Роль с ID "%" не существует', p_role_id;
    END IF;

    UPDATE users
    SET
        last_name = p_last_name,
        first_name = p_first_name,
        middle_name = p_middle_name,
        role_id = p_role_id, 
        password_hash = CASE
            WHEN p_new_password IS NOT NULL
            THEN crypt(p_new_password, gen_salt('bf'))
            ELSE password_hash
        END
    WHERE user_id = p_target_user_id;
END;
$$;


ALTER FUNCTION public.update_user(p_admin_id integer, p_target_user_id integer, p_last_name text, p_first_name text, p_middle_name text, p_role_id integer, p_new_password text) OWNER TO postgres;

--
-- TOC entry 301 (class 1255 OID 24817)
-- Name: update_user(integer, integer, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user(p_admin_id integer, p_target_user_id integer, p_last_name text, p_first_name text, p_middle_name text, p_role_name text, p_new_password text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    admin_role TEXT;
    new_role_id INTEGER;
BEGIN
    SELECT u.role_id INTO admin_role FROM users u WHERE u.user_id = p_admin_id;
    IF admin_role != '3' THEN
        RAISE EXCEPTION 'Только администратор может редактировать пользователей';
    END IF;

    IF p_admin_id = p_target_user_id THEN
        RAISE EXCEPTION 'Нельзя редактировать самого себя';
    END IF;

    SELECT role_id INTO new_role_id FROM roles WHERE role_name = p_role_name;
    IF new_role_id IS NULL THEN
        RAISE EXCEPTION 'Роль "%" не существует', p_role_name;
    END IF;

    UPDATE users
    SET
        last_name = p_last_name,
        first_name = p_first_name,
        middle_name = p_middle_name,
        role_id = new_role_id,
        password_hash = CASE
            WHEN p_new_password IS NOT NULL
            THEN crypt(p_new_password, gen_salt('bf'))
            ELSE password_hash
        END
    WHERE user_id = p_target_user_id;
END;
$$;


ALTER FUNCTION public.update_user(p_admin_id integer, p_target_user_id integer, p_last_name text, p_first_name text, p_middle_name text, p_role_name text, p_new_password text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 24764)
-- Name: assignment_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_attachments (
    attachment_id integer NOT NULL,
    assignment_id integer,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text,
    uploaded_at timestamp without time zone DEFAULT now(),
    CONSTRAINT assignment_attachments_file_type_check CHECK ((file_type = ANY (ARRAY['image'::text, 'pdf'::text, 'doc'::text])))
);


ALTER TABLE public.assignment_attachments OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24763)
-- Name: assignment_attachments_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignment_attachments_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignment_attachments_attachment_id_seq OWNER TO postgres;

--
-- TOC entry 5033 (class 0 OID 0)
-- Dependencies: 231
-- Name: assignment_attachments_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignment_attachments_attachment_id_seq OWNED BY public.assignment_attachments.attachment_id;


--
-- TOC entry 233 (class 1259 OID 24779)
-- Name: assignment_reagents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_reagents (
    assignment_id integer NOT NULL,
    reagent_id integer NOT NULL
);


ALTER TABLE public.assignment_reagents OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 24752)
-- Name: assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignments (
    assignment_id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    instructions text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.assignments OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 24751)
-- Name: assignments_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assignments_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignments_assignment_id_seq OWNER TO postgres;

--
-- TOC entry 5034 (class 0 OID 0)
-- Dependencies: 229
-- Name: assignments_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assignments_assignment_id_seq OWNED BY public.assignments.assignment_id;


--
-- TOC entry 226 (class 1259 OID 24653)
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    log_id integer NOT NULL,
    operation text NOT NULL,
    table_name text NOT NULL,
    record_id integer NOT NULL,
    user_id integer,
    "timestamp" timestamp with time zone DEFAULT now(),
    details text,
    CONSTRAINT audit_log_operation_check CHECK ((operation = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text, 'CREATE_USER'::text, 'CREATE_REVIEW'::text, 'UPDATE_REVIEW'::text])))
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24652)
-- Name: audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_log_id_seq OWNER TO postgres;

--
-- TOC entry 5035 (class 0 OID 0)
-- Dependencies: 225
-- Name: audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_log_id_seq OWNED BY public.audit_log.log_id;


--
-- TOC entry 224 (class 1259 OID 16592)
-- Name: experiment_reagents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.experiment_reagents (
    experiment_id integer NOT NULL,
    reagent_id integer NOT NULL,
    amount numeric NOT NULL,
    unit text,
    CONSTRAINT check_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT check_unit_valid CHECK ((unit = ANY (ARRAY['г'::text, 'мл'::text]))),
    CONSTRAINT experiment_reagents_unit_check CHECK ((unit = ANY (ARRAY['г'::text, 'мл'::text])))
);


ALTER TABLE public.experiment_reagents OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 24676)
-- Name: experiment_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.experiment_reviews (
    review_id integer NOT NULL,
    experiment_id integer NOT NULL,
    reviewer_id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT experiment_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.experiment_reviews OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24675)
-- Name: experiment_reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.experiment_reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiment_reviews_review_id_seq OWNER TO postgres;

--
-- TOC entry 5036 (class 0 OID 0)
-- Dependencies: 227
-- Name: experiment_reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.experiment_reviews_review_id_seq OWNED BY public.experiment_reviews.review_id;


--
-- TOC entry 221 (class 1259 OID 16568)
-- Name: experiments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.experiments (
    experiment_id integer NOT NULL,
    date_conducted date NOT NULL,
    description text,
    observations text,
    user_id integer NOT NULL,
    theme text DEFAULT 'Без темы'::text
);


ALTER TABLE public.experiments OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16567)
-- Name: experiments_experiment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.experiments_experiment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiments_experiment_id_seq OWNER TO postgres;

--
-- TOC entry 5037 (class 0 OID 0)
-- Dependencies: 220
-- Name: experiments_experiment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.experiments_experiment_id_seq OWNED BY public.experiments.experiment_id;


--
-- TOC entry 223 (class 1259 OID 16582)
-- Name: reagents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reagents (
    reagent_id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.reagents OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16581)
-- Name: reagents_reagent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reagents_reagent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reagents_reagent_id_seq OWNER TO postgres;

--
-- TOC entry 5038 (class 0 OID 0)
-- Dependencies: 222
-- Name: reagents_reagent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reagents_reagent_id_seq OWNED BY public.reagents.reagent_id;


--
-- TOC entry 235 (class 1259 OID 24799)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name text NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 24798)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 234
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 219 (class 1259 OID 16555)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    last_name text,
    first_name text,
    middle_name text,
    role_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16554)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5040 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4816 (class 2604 OID 24767)
-- Name: assignment_attachments attachment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_attachments ALTER COLUMN attachment_id SET DEFAULT nextval('public.assignment_attachments_attachment_id_seq'::regclass);


--
-- TOC entry 4812 (class 2604 OID 24755)
-- Name: assignments assignment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments ALTER COLUMN assignment_id SET DEFAULT nextval('public.assignments_assignment_id_seq'::regclass);


--
-- TOC entry 4808 (class 2604 OID 24656)
-- Name: audit_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.audit_log_log_id_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 24679)
-- Name: experiment_reviews review_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiment_reviews ALTER COLUMN review_id SET DEFAULT nextval('public.experiment_reviews_review_id_seq'::regclass);


--
-- TOC entry 4805 (class 2604 OID 16571)
-- Name: experiments experiment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiments ALTER COLUMN experiment_id SET DEFAULT nextval('public.experiments_experiment_id_seq'::regclass);


--
-- TOC entry 4807 (class 2604 OID 16585)
-- Name: reagents reagent_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reagents ALTER COLUMN reagent_id SET DEFAULT nextval('public.reagents_reagent_id_seq'::regclass);


--
-- TOC entry 4818 (class 2604 OID 24802)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4802 (class 2604 OID 16558)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5023 (class 0 OID 24764)
-- Dependencies: 232
-- Data for Name: assignment_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5024 (class 0 OID 24779)
-- Dependencies: 233
-- Data for Name: assignment_reagents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.assignment_reagents VALUES (1, 1);
INSERT INTO public.assignment_reagents VALUES (5, 1);
INSERT INTO public.assignment_reagents VALUES (5, 2);
INSERT INTO public.assignment_reagents VALUES (5, 3);
INSERT INTO public.assignment_reagents VALUES (5, 4);
INSERT INTO public.assignment_reagents VALUES (5, 5);
INSERT INTO public.assignment_reagents VALUES (5, 6);
INSERT INTO public.assignment_reagents VALUES (5, 7);
INSERT INTO public.assignment_reagents VALUES (5, 8);
INSERT INTO public.assignment_reagents VALUES (5, 9);
INSERT INTO public.assignment_reagents VALUES (5, 10);
INSERT INTO public.assignment_reagents VALUES (5, 52);
INSERT INTO public.assignment_reagents VALUES (5, 56);
INSERT INTO public.assignment_reagents VALUES (5, 75);
INSERT INTO public.assignment_reagents VALUES (5, 106);


--
-- TOC entry 5021 (class 0 OID 24752)
-- Dependencies: 230
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.assignments VALUES (1, 'Лабораторная работа №1', 'test', 'test', true, '2026-03-16 11:45:34.609266', '2026-03-16 11:45:34.609266');
INSERT INTO public.assignments VALUES (5, 'Лабораторная работа №2', 'В этой лабораторной работе вам предстоит...', '1) Возьмите...', true, '2026-03-18 12:30:40.033789', '2026-04-17 15:53:20.384988');


--
-- TOC entry 5017 (class 0 OID 24653)
-- Dependencies: 226
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.audit_log VALUES (26, 'INSERT', 'experiments', 55, 1, '2025-12-11 21:31:08.6139+03', NULL);
INSERT INTO public.audit_log VALUES (27, 'INSERT', 'experiment_reagents', 55, 1, '2025-12-11 21:31:08.6139+03', NULL);
INSERT INTO public.audit_log VALUES (37, 'INSERT', 'experiments', 56, 2, '2025-12-11 21:42:40.802127+03', NULL);
INSERT INTO public.audit_log VALUES (38, 'INSERT', 'experiment_reagents', 56, 2, '2025-12-11 21:42:40.802127+03', NULL);
INSERT INTO public.audit_log VALUES (39, 'INSERT', 'experiment_reagents', 56, 2, '2025-12-11 21:42:40.802127+03', NULL);
INSERT INTO public.audit_log VALUES (41, 'CREATE_USER', 'users', 16, 2, '2025-12-11 21:46:58.33611+03', 'Создан пользователь: sidorov (роль: student)');
INSERT INTO public.audit_log VALUES (42, 'INSERT', 'experiments', 57, 16, '2025-12-11 21:48:55.643719+03', NULL);
INSERT INTO public.audit_log VALUES (43, 'INSERT', 'experiment_reagents', 57, 16, '2025-12-11 21:48:55.643719+03', NULL);
INSERT INTO public.audit_log VALUES (44, 'CREATE_USER', 'users', 17, 3, '2025-12-11 21:52:19.357029+03', 'Создан пользователь: test (роль: student)');
INSERT INTO public.audit_log VALUES (45, 'DELETE', 'experiments', 42, 2, '2025-12-12 11:42:33.895313+03', NULL);
INSERT INTO public.audit_log VALUES (46, 'DELETE', 'experiment_reagents', 42, 2, '2025-12-12 11:42:33.895313+03', NULL);
INSERT INTO public.audit_log VALUES (47, 'CREATE_REVIEW', 'experiment_reviews', 40, 2, '2025-12-16 14:37:37.530588+03', 'Оценка эксперимента 40: 3 ⭐');
INSERT INTO public.audit_log VALUES (48, 'UPDATE_REVIEW', 'experiment_reviews', 40, 2, '2025-12-16 14:37:42.647206+03', 'Оценка эксперимента 40: 3 ⭐');
INSERT INTO public.audit_log VALUES (49, 'UPDATE_REVIEW', 'experiment_reviews', 40, 3, '2025-12-16 14:38:00.672646+03', 'Оценка эксперимента 40: 4 ⭐');
INSERT INTO public.audit_log VALUES (50, 'INSERT', 'experiments', 58, 4, '2025-12-16 16:45:33.933182+03', NULL);
INSERT INTO public.audit_log VALUES (51, 'INSERT', 'experiment_reagents', 58, 4, '2025-12-16 16:45:33.933182+03', NULL);
INSERT INTO public.audit_log VALUES (52, 'CREATE_USER', 'users', 18, 2, '2025-12-18 18:37:39.455208+03', 'Создан пользователь: block_test (роль: student)');
INSERT INTO public.audit_log VALUES (53, 'INSERT', 'experiments', 59, 18, '2025-12-18 18:38:24.775504+03', NULL);
INSERT INTO public.audit_log VALUES (54, 'INSERT', 'experiment_reagents', 59, 18, '2025-12-18 18:38:24.775504+03', NULL);
INSERT INTO public.audit_log VALUES (55, 'INSERT', 'experiments', 60, 2, '2025-12-18 20:01:57.323487+03', NULL);
INSERT INTO public.audit_log VALUES (56, 'INSERT', 'experiment_reagents', 60, 2, '2025-12-18 20:01:57.323487+03', NULL);
INSERT INTO public.audit_log VALUES (57, 'DELETE', 'experiments', 60, 2, '2025-12-18 20:02:06.454711+03', NULL);
INSERT INTO public.audit_log VALUES (58, 'DELETE', 'experiment_reagents', 60, 2, '2025-12-18 20:02:06.454711+03', NULL);
INSERT INTO public.audit_log VALUES (59, 'UPDATE', 'experiments', 58, 2, '2025-12-18 20:21:07.29398+03', NULL);
INSERT INTO public.audit_log VALUES (60, 'DELETE', 'experiment_reagents', 58, 2, '2025-12-18 20:21:07.29398+03', NULL);
INSERT INTO public.audit_log VALUES (61, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-18 20:21:07.29398+03', NULL);
INSERT INTO public.audit_log VALUES (62, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-18 20:21:07.29398+03', NULL);
INSERT INTO public.audit_log VALUES (63, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-18 20:21:07.29398+03', NULL);
INSERT INTO public.audit_log VALUES (64, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-18 20:21:07.29398+03', NULL);
INSERT INTO public.audit_log VALUES (65, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-18 20:21:07.29398+03', NULL);
INSERT INTO public.audit_log VALUES (66, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-18 20:21:07.29398+03', NULL);
INSERT INTO public.audit_log VALUES (67, 'CREATE_REVIEW', 'experiment_reviews', 58, 2, '2025-12-18 20:22:35.559461+03', 'Оценка эксперимента 58: 5 ⭐');
INSERT INTO public.audit_log VALUES (68, 'DELETE', 'experiments', 59, 2, '2025-12-18 23:08:21.680015+03', NULL);
INSERT INTO public.audit_log VALUES (69, 'DELETE', 'experiment_reagents', 59, 2, '2025-12-18 23:08:21.680015+03', NULL);
INSERT INTO public.audit_log VALUES (70, 'INSERT', 'experiments', 61, 1, '2025-12-19 11:38:45.268584+03', NULL);
INSERT INTO public.audit_log VALUES (71, 'INSERT', 'experiment_reagents', 61, 1, '2025-12-19 11:38:45.268584+03', NULL);
INSERT INTO public.audit_log VALUES (72, 'INSERT', 'experiment_reagents', 61, 1, '2025-12-19 11:38:45.268584+03', NULL);
INSERT INTO public.audit_log VALUES (73, 'UPDATE_REVIEW', 'experiment_reviews', 40, 2, '2025-12-19 11:42:27.59593+03', 'Оценка эксперимента 40: 4 ⭐');
INSERT INTO public.audit_log VALUES (74, 'DELETE', 'experiments', 61, 2, '2025-12-24 18:49:05.887226+03', NULL);
INSERT INTO public.audit_log VALUES (75, 'DELETE', 'experiment_reagents', 61, 2, '2025-12-24 18:49:05.887226+03', NULL);
INSERT INTO public.audit_log VALUES (76, 'DELETE', 'experiment_reagents', 61, 2, '2025-12-24 18:49:05.887226+03', NULL);
INSERT INTO public.audit_log VALUES (77, 'INSERT', 'experiments', 62, 2, '2025-12-25 15:01:41.827278+03', NULL);
INSERT INTO public.audit_log VALUES (78, 'INSERT', 'experiment_reagents', 62, 2, '2025-12-25 15:01:41.827278+03', NULL);
INSERT INTO public.audit_log VALUES (79, 'INSERT', 'experiment_reagents', 62, 2, '2025-12-25 15:01:41.827278+03', NULL);
INSERT INTO public.audit_log VALUES (80, 'CREATE_REVIEW', 'experiment_reviews', 62, 2, '2025-12-25 15:01:53.920644+03', 'Оценка эксперимента 62: 3 ⭐');
INSERT INTO public.audit_log VALUES (81, 'DELETE', 'experiments', 62, 2, '2025-12-25 15:02:13.43395+03', NULL);
INSERT INTO public.audit_log VALUES (82, 'DELETE', 'experiment_reagents', 62, 2, '2025-12-25 15:02:13.43395+03', NULL);
INSERT INTO public.audit_log VALUES (83, 'DELETE', 'experiment_reagents', 62, 2, '2025-12-25 15:02:13.43395+03', NULL);
INSERT INTO public.audit_log VALUES (84, 'INSERT', 'experiments', 63, 2, '2025-12-25 15:13:58.430907+03', NULL);
INSERT INTO public.audit_log VALUES (85, 'INSERT', 'experiment_reagents', 63, 2, '2025-12-25 15:13:58.430907+03', NULL);
INSERT INTO public.audit_log VALUES (86, 'DELETE', 'experiments', 63, 2, '2025-12-25 15:14:06.700665+03', NULL);
INSERT INTO public.audit_log VALUES (87, 'DELETE', 'experiment_reagents', 63, 2, '2025-12-25 15:14:06.700665+03', NULL);
INSERT INTO public.audit_log VALUES (88, 'UPDATE', 'experiments', 57, 2, '2025-12-25 15:20:48.392536+03', NULL);
INSERT INTO public.audit_log VALUES (89, 'DELETE', 'experiment_reagents', 57, 2, '2025-12-25 15:20:48.392536+03', NULL);
INSERT INTO public.audit_log VALUES (90, 'INSERT', 'experiment_reagents', 57, 2, '2025-12-25 15:20:48.392536+03', NULL);
INSERT INTO public.audit_log VALUES (91, 'CREATE_USER', 'users', 19, 2, '2025-12-25 15:33:28.773461+03', 'Создан пользователь: testTest (роль: student)');
INSERT INTO public.audit_log VALUES (92, 'INSERT', 'experiments', 64, 19, '2025-12-25 15:34:17.669877+03', NULL);
INSERT INTO public.audit_log VALUES (93, 'INSERT', 'experiment_reagents', 64, 19, '2025-12-25 15:34:17.669877+03', NULL);
INSERT INTO public.audit_log VALUES (94, 'INSERT', 'experiment_reagents', 64, 19, '2025-12-25 15:34:17.669877+03', NULL);
INSERT INTO public.audit_log VALUES (95, 'DELETE', 'experiments', 64, 2, '2025-12-25 15:36:12.027859+03', NULL);
INSERT INTO public.audit_log VALUES (96, 'DELETE', 'experiment_reagents', 64, 2, '2025-12-25 15:36:12.027859+03', NULL);
INSERT INTO public.audit_log VALUES (97, 'DELETE', 'experiment_reagents', 64, 2, '2025-12-25 15:36:12.027859+03', NULL);
INSERT INTO public.audit_log VALUES (98, 'INSERT', 'experiments', 65, 17, '2025-12-25 15:36:47.830152+03', NULL);
INSERT INTO public.audit_log VALUES (99, 'INSERT', 'experiment_reagents', 65, 17, '2025-12-25 15:36:47.830152+03', NULL);
INSERT INTO public.audit_log VALUES (100, 'DELETE', 'experiments', 65, 17, '2025-12-25 15:37:16.140358+03', NULL);
INSERT INTO public.audit_log VALUES (101, 'DELETE', 'experiment_reagents', 65, 17, '2025-12-25 15:37:16.140358+03', NULL);
INSERT INTO public.audit_log VALUES (102, 'UPDATE', 'experiments', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (103, 'DELETE', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (104, 'DELETE', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (105, 'DELETE', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (106, 'DELETE', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (107, 'DELETE', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (108, 'DELETE', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (109, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (110, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (111, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (112, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (113, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (114, 'INSERT', 'experiment_reagents', 58, 2, '2025-12-25 15:53:24.176874+03', NULL);
INSERT INTO public.audit_log VALUES (115, 'INSERT', 'experiments', 66, 1, '2025-12-25 16:49:49.304973+03', NULL);
INSERT INTO public.audit_log VALUES (116, 'INSERT', 'experiment_reagents', 66, 1, '2025-12-25 16:49:49.304973+03', NULL);
INSERT INTO public.audit_log VALUES (117, 'UPDATE', 'experiments', 66, 1, '2025-12-25 16:52:10.187595+03', NULL);
INSERT INTO public.audit_log VALUES (118, 'DELETE', 'experiment_reagents', 66, 1, '2025-12-25 16:52:10.187595+03', NULL);
INSERT INTO public.audit_log VALUES (119, 'INSERT', 'experiment_reagents', 66, 1, '2025-12-25 16:52:10.187595+03', NULL);
INSERT INTO public.audit_log VALUES (120, 'CREATE_REVIEW', 'experiment_reviews', 66, 3, '2025-12-25 16:53:33.141463+03', 'Оценка эксперимента 66: 3 ⭐');
INSERT INTO public.audit_log VALUES (121, 'DELETE', 'experiments', 66, 3, '2025-12-25 16:53:47.243842+03', NULL);
INSERT INTO public.audit_log VALUES (122, 'DELETE', 'experiment_reagents', 66, 3, '2025-12-25 16:53:47.243842+03', NULL);
INSERT INTO public.audit_log VALUES (123, 'INSERT', 'experiments', 67, 3, '2026-02-27 10:02:47.95227+03', NULL);
INSERT INTO public.audit_log VALUES (124, 'INSERT', 'experiment_reagents', 67, 3, '2026-02-27 10:02:47.95227+03', NULL);
INSERT INTO public.audit_log VALUES (125, 'INSERT', 'experiments', 68, 1, '2026-02-28 23:26:03.353927+03', NULL);
INSERT INTO public.audit_log VALUES (126, 'INSERT', 'experiment_reagents', 68, 1, '2026-02-28 23:26:03.353927+03', NULL);
INSERT INTO public.audit_log VALUES (128, 'UPDATE', 'experiments', 67, 2, '2026-03-03 00:28:16.619811+03', NULL);
INSERT INTO public.audit_log VALUES (129, 'DELETE', 'experiment_reagents', 67, 2, '2026-03-03 00:28:16.619811+03', NULL);
INSERT INTO public.audit_log VALUES (130, 'INSERT', 'experiment_reagents', 67, 2, '2026-03-03 00:28:16.619811+03', NULL);
INSERT INTO public.audit_log VALUES (131, 'CREATE_REVIEW', 'experiment_reviews', 57, 2, '2026-03-03 11:32:32.612438+03', 'Оценка эксперимента 57: 3 ⭐');
INSERT INTO public.audit_log VALUES (132, 'INSERT', 'experiments', 69, 2, '2026-03-03 11:39:22.569675+03', NULL);
INSERT INTO public.audit_log VALUES (133, 'INSERT', 'experiment_reagents', 69, 2, '2026-03-03 11:39:22.569675+03', NULL);
INSERT INTO public.audit_log VALUES (127, 'UPDATE', 'experiments', 67, 2, '2026-03-03 00:27:32.839643+03', NULL);
INSERT INTO public.audit_log VALUES (134, 'UPDATE', 'experiments', 58, 2, '2026-03-09 14:42:13.642091+03', NULL);
INSERT INTO public.audit_log VALUES (135, 'DELETE', 'experiments', 40, 2, '2026-04-13 11:35:38.063648+03', NULL);
INSERT INTO public.audit_log VALUES (136, 'DELETE', 'experiment_reagents', 40, 2, '2026-04-13 11:35:38.063648+03', NULL);
INSERT INTO public.audit_log VALUES (137, 'CREATE_REVIEW', 'experiment_reviews', 69, 2, '2026-04-17 15:48:36.791118+03', 'Оценка эксперимента 69: 4 ⭐');
INSERT INTO public.audit_log VALUES (138, 'DELETE', 'experiments', 69, 2, '2026-04-17 15:49:12.197316+03', NULL);
INSERT INTO public.audit_log VALUES (139, 'DELETE', 'experiment_reagents', 69, 2, '2026-04-17 15:49:12.197316+03', NULL);
INSERT INTO public.audit_log VALUES (140, 'UPDATE', 'experiments', 68, 2, '2026-04-17 15:52:04.393264+03', NULL);
INSERT INTO public.audit_log VALUES (141, 'DELETE', 'experiment_reagents', 68, 2, '2026-04-17 15:52:04.393264+03', NULL);
INSERT INTO public.audit_log VALUES (142, 'INSERT', 'experiment_reagents', 68, 2, '2026-04-17 15:52:04.393264+03', NULL);
INSERT INTO public.audit_log VALUES (143, 'INSERT', 'experiment_reagents', 68, 2, '2026-04-17 15:52:04.393264+03', NULL);
INSERT INTO public.audit_log VALUES (144, 'INSERT', 'experiment_reagents', 68, 2, '2026-04-17 15:52:04.393264+03', NULL);
INSERT INTO public.audit_log VALUES (145, 'CREATE_REVIEW', 'experiment_reviews', 68, 2, '2026-05-02 16:24:45.050155+03', 'Оценка эксперимента 68: 4 ⭐');


--
-- TOC entry 5015 (class 0 OID 16592)
-- Dependencies: 224
-- Data for Name: experiment_reagents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.experiment_reagents VALUES (36, 1, 5, 'г');
INSERT INTO public.experiment_reagents VALUES (37, 1, 2, 'г');
INSERT INTO public.experiment_reagents VALUES (41, 1, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (41, 2, 2, 'г');
INSERT INTO public.experiment_reagents VALUES (41, 3, 3, 'г');
INSERT INTO public.experiment_reagents VALUES (44, 1, 2, 'г');
INSERT INTO public.experiment_reagents VALUES (46, 1, 2, 'г');
INSERT INTO public.experiment_reagents VALUES (54, 2, 2, 'г');
INSERT INTO public.experiment_reagents VALUES (45, 1, 3, 'г');
INSERT INTO public.experiment_reagents VALUES (45, 3, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (47, 3, 3, 'г');
INSERT INTO public.experiment_reagents VALUES (55, 1, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (56, 1, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (56, 3, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (57, 1, 100, 'мл');
INSERT INTO public.experiment_reagents VALUES (58, 6, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (58, 7, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (58, 16, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (58, 17, 3, 'г');
INSERT INTO public.experiment_reagents VALUES (58, 19, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (58, 26, 1, 'г');
INSERT INTO public.experiment_reagents VALUES (67, 1, 1.01, 'г');
INSERT INTO public.experiment_reagents VALUES (68, 1, 2, 'г');
INSERT INTO public.experiment_reagents VALUES (68, 42, 42, 'мл');
INSERT INTO public.experiment_reagents VALUES (68, 52, 51.99, 'г');


--
-- TOC entry 5019 (class 0 OID 24676)
-- Dependencies: 228
-- Data for Name: experiment_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.experiment_reviews VALUES (11, 58, 2, 5, 'Ещё предстоит работа над более удобным вводом реагентов, например с помощью строк в формате FeCl3 + KSCN.', '2025-12-18 20:22:35.559461+03');
INSERT INTO public.experiment_reviews VALUES (14, 57, 2, 3, NULL, '2026-03-03 11:32:32.612438+03');
INSERT INTO public.experiment_reviews VALUES (16, 68, 2, 4, 'test', '2026-05-02 16:24:45.050155+03');


--
-- TOC entry 5012 (class 0 OID 16568)
-- Dependencies: 221
-- Data for Name: experiments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.experiments VALUES (47, '2025-12-12', 'test new user and edit by adm and by author', 'test', 4, NULL);
INSERT INTO public.experiments VALUES (55, '2025-12-11', 'test1', 'test1', 1, NULL);
INSERT INTO public.experiments VALUES (56, '2025-12-11', 'test', 'test', 2, NULL);
INSERT INTO public.experiments VALUES (58, '2025-12-25', 'Эксперимент был направлен на изучение качественной реакции на ионы железа(III) с использованием роданида калия (KSCN). В качестве реагентов применялись водные растворы хлорида железа(III) (FeCl₃) и роданида калия. Ионы Fe³⁺ способны образовывать с роданид-ионами (SCN⁻) устойчивый окрашенный комплекс, что позволяет использовать данную реакцию для визуального обнаружения трёхвалентного железа в растворе. Процедура проводилась при комнатной температуре в пробирке с соблюдением правил техники безопасности: использовались защитные очки и перчатки, все манипуляции выполнялись вдали от открытого огня.', 'Исходный раствор хлорида железа(III) имел характерный жёлто-коричневый оттенок, обусловленный гидролизом ионов Fe³⁺ в воде. Раствор роданида калия был прозрачным и бесцветным. После добавления нескольких капель KSCN к раствору FeCl₃ произошло мгновенное изменение окраски: смесь приобрела насыщенный кроваво-красный цвет. Это свидетельствует о протекании реакции с образованием комплексного соединения — тиоцианатоферрата(III).
 
Цвет раствора оставался стабильным в течение всего времени наблюдения (около 10 минут), что указывает на высокую устойчивость образовавшегося комплекса. Осадок не выпадал, газообразование отсутствовало, температура пробирки ощутимо не изменилась. При дальнейшем добавлении KSCN интенсивность окраски увеличивалась, что подтверждает зависимость цвета от концентрации комплекса. Эксперимент наглядно продемонстрировал высокую чувствительность данной реакции: даже небольшое количество роданид-ионов вызывает ярко выраженный визуальный эффект.', 4, 'Изучение качественной реакции на ионы железа(III) с использованием роданида калия (KSCN)');
INSERT INTO public.experiments VALUES (57, '2025-12-25', '123456', '123', 16, NULL);
INSERT INTO public.experiments VALUES (68, '2026-04-02', 'test sensitive test', 'test sensitive test', 1, NULL);
INSERT INTO public.experiments VALUES (67, '2026-03-02', 'Лабораторная работа №1
длодлодлодо
test', 'длодлт', 3, 'Лабораторная работа №1');
INSERT INTO public.experiments VALUES (36, '2025-11-27', 'test ', 'test test', 1, NULL);
INSERT INTO public.experiments VALUES (37, '2025-11-27', 'test2', 'test22', 1, NULL);
INSERT INTO public.experiments VALUES (41, '2025-11-28', 'test3', 'test3', 1, NULL);
INSERT INTO public.experiments VALUES (44, '2025-11-30', 'asd', 'sdfa', 1, NULL);
INSERT INTO public.experiments VALUES (46, '2025-12-10', 'test admin', 'test admin', 2, NULL);
INSERT INTO public.experiments VALUES (52, '2025-11-27', 'Тест', NULL, 1, NULL);
INSERT INTO public.experiments VALUES (54, '2025-12-11', 'test after aud', 'test after aud', 2, NULL);
INSERT INTO public.experiments VALUES (45, '2025-12-11', 'фывфыasdas', 'ыфвфыв', 1, NULL);


--
-- TOC entry 5014 (class 0 OID 16582)
-- Dependencies: 223
-- Data for Name: reagents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.reagents VALUES (1, 'H');
INSERT INTO public.reagents VALUES (2, 'He');
INSERT INTO public.reagents VALUES (3, 'Li');
INSERT INTO public.reagents VALUES (4, 'Be');
INSERT INTO public.reagents VALUES (5, 'B');
INSERT INTO public.reagents VALUES (6, 'C');
INSERT INTO public.reagents VALUES (7, 'N');
INSERT INTO public.reagents VALUES (8, 'O');
INSERT INTO public.reagents VALUES (9, 'F');
INSERT INTO public.reagents VALUES (10, 'Ne');
INSERT INTO public.reagents VALUES (11, 'Na');
INSERT INTO public.reagents VALUES (12, 'Mg');
INSERT INTO public.reagents VALUES (13, 'Al');
INSERT INTO public.reagents VALUES (14, 'Si');
INSERT INTO public.reagents VALUES (15, 'P');
INSERT INTO public.reagents VALUES (16, 'S');
INSERT INTO public.reagents VALUES (17, 'Cl');
INSERT INTO public.reagents VALUES (18, 'Ar');
INSERT INTO public.reagents VALUES (19, 'K');
INSERT INTO public.reagents VALUES (20, 'Ca');
INSERT INTO public.reagents VALUES (21, 'Sc');
INSERT INTO public.reagents VALUES (22, 'Ti');
INSERT INTO public.reagents VALUES (23, 'V');
INSERT INTO public.reagents VALUES (24, 'Cr');
INSERT INTO public.reagents VALUES (25, 'Mn');
INSERT INTO public.reagents VALUES (26, 'Fe');
INSERT INTO public.reagents VALUES (27, 'Co');
INSERT INTO public.reagents VALUES (28, 'Ni');
INSERT INTO public.reagents VALUES (29, 'Cu');
INSERT INTO public.reagents VALUES (30, 'Zn');
INSERT INTO public.reagents VALUES (31, 'Ga');
INSERT INTO public.reagents VALUES (32, 'Ge');
INSERT INTO public.reagents VALUES (33, 'As');
INSERT INTO public.reagents VALUES (34, 'Se');
INSERT INTO public.reagents VALUES (35, 'Br');
INSERT INTO public.reagents VALUES (36, 'Kr');
INSERT INTO public.reagents VALUES (37, 'Rb');
INSERT INTO public.reagents VALUES (38, 'Sr');
INSERT INTO public.reagents VALUES (39, 'Y');
INSERT INTO public.reagents VALUES (40, 'Zr');
INSERT INTO public.reagents VALUES (41, 'Nb');
INSERT INTO public.reagents VALUES (42, 'Mo');
INSERT INTO public.reagents VALUES (43, 'Tc');
INSERT INTO public.reagents VALUES (44, 'Ru');
INSERT INTO public.reagents VALUES (45, 'Rh');
INSERT INTO public.reagents VALUES (46, 'Pd');
INSERT INTO public.reagents VALUES (47, 'Ag');
INSERT INTO public.reagents VALUES (48, 'Cd');
INSERT INTO public.reagents VALUES (49, 'In');
INSERT INTO public.reagents VALUES (50, 'Sn');
INSERT INTO public.reagents VALUES (51, 'Sb');
INSERT INTO public.reagents VALUES (52, 'Te');
INSERT INTO public.reagents VALUES (53, 'I');
INSERT INTO public.reagents VALUES (54, 'Xe');
INSERT INTO public.reagents VALUES (55, 'Cs');
INSERT INTO public.reagents VALUES (56, 'Ba');
INSERT INTO public.reagents VALUES (57, 'La');
INSERT INTO public.reagents VALUES (58, 'Ce');
INSERT INTO public.reagents VALUES (59, 'Pr');
INSERT INTO public.reagents VALUES (60, 'Nd');
INSERT INTO public.reagents VALUES (61, 'Pm');
INSERT INTO public.reagents VALUES (62, 'Sm');
INSERT INTO public.reagents VALUES (63, 'Eu');
INSERT INTO public.reagents VALUES (64, 'Gd');
INSERT INTO public.reagents VALUES (65, 'Tb');
INSERT INTO public.reagents VALUES (66, 'Dy');
INSERT INTO public.reagents VALUES (67, 'Ho');
INSERT INTO public.reagents VALUES (68, 'Er');
INSERT INTO public.reagents VALUES (69, 'Tm');
INSERT INTO public.reagents VALUES (70, 'Yb');
INSERT INTO public.reagents VALUES (71, 'Lu');
INSERT INTO public.reagents VALUES (72, 'Hf');
INSERT INTO public.reagents VALUES (73, 'Ta');
INSERT INTO public.reagents VALUES (74, 'W');
INSERT INTO public.reagents VALUES (75, 'Re');
INSERT INTO public.reagents VALUES (76, 'Os');
INSERT INTO public.reagents VALUES (77, 'Ir');
INSERT INTO public.reagents VALUES (78, 'Pt');
INSERT INTO public.reagents VALUES (79, 'Au');
INSERT INTO public.reagents VALUES (80, 'Hg');
INSERT INTO public.reagents VALUES (81, 'Tl');
INSERT INTO public.reagents VALUES (82, 'Pb');
INSERT INTO public.reagents VALUES (83, 'Bi');
INSERT INTO public.reagents VALUES (84, 'Po');
INSERT INTO public.reagents VALUES (85, 'At');
INSERT INTO public.reagents VALUES (86, 'Rn');
INSERT INTO public.reagents VALUES (87, 'Fr');
INSERT INTO public.reagents VALUES (88, 'Ra');
INSERT INTO public.reagents VALUES (89, 'Ac');
INSERT INTO public.reagents VALUES (90, 'Th');
INSERT INTO public.reagents VALUES (91, 'Pa');
INSERT INTO public.reagents VALUES (92, 'U');
INSERT INTO public.reagents VALUES (93, 'Np');
INSERT INTO public.reagents VALUES (94, 'Pu');
INSERT INTO public.reagents VALUES (95, 'Am');
INSERT INTO public.reagents VALUES (96, 'Cm');
INSERT INTO public.reagents VALUES (97, 'Bk');
INSERT INTO public.reagents VALUES (98, 'Cf');
INSERT INTO public.reagents VALUES (99, 'Es');
INSERT INTO public.reagents VALUES (100, 'Fm');
INSERT INTO public.reagents VALUES (101, 'Md');
INSERT INTO public.reagents VALUES (102, 'No');
INSERT INTO public.reagents VALUES (103, 'Lr');
INSERT INTO public.reagents VALUES (104, 'Rf');
INSERT INTO public.reagents VALUES (105, 'Db');
INSERT INTO public.reagents VALUES (106, 'Sg');
INSERT INTO public.reagents VALUES (107, 'Bh');
INSERT INTO public.reagents VALUES (108, 'Hs');
INSERT INTO public.reagents VALUES (109, 'Mt');
INSERT INTO public.reagents VALUES (110, 'Ds');
INSERT INTO public.reagents VALUES (111, 'Rg');
INSERT INTO public.reagents VALUES (112, 'Cn');
INSERT INTO public.reagents VALUES (113, 'Nh');
INSERT INTO public.reagents VALUES (114, 'Fl');
INSERT INTO public.reagents VALUES (115, 'Mc');
INSERT INTO public.reagents VALUES (116, 'Lv');
INSERT INTO public.reagents VALUES (117, 'Ts');
INSERT INTO public.reagents VALUES (118, 'Og');


--
-- TOC entry 5026 (class 0 OID 24799)
-- Dependencies: 235
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles VALUES (1, 'student');
INSERT INTO public.roles VALUES (2, 'teacher');
INSERT INTO public.roles VALUES (3, 'admin');


--
-- TOC entry 5010 (class 0 OID 16555)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (2, 'admin', '$2a$12$TX.cI04Al3qv/vPcXaz0cuMF0z9iHd83UWqGvPkGy8JtbwXVlMwHW', '2025-12-10 22:08:53.487638', true, 'Админов', 'Админ', 'Админович', 3);
INSERT INTO public.users VALUES (3, 'teacher', '$2a$12$K0WZ8ZV.nvJcIzBKyRVEQeMjMHn9YKdYu6YyXXmsDM/KMZX2OuaN.', '2025-12-10 22:12:36.168722', true, 'Учителев', 'Учитель', 'Учителевич', 2);
INSERT INTO public.users VALUES (4, 'petrov', '$2b$10$aXRSclV31iWE.ha5b4JCre3I6/lJMFu.X0dNFmV9i5Yb881EORo1i', '2025-12-11 00:27:48.266755', true, 'Петров', 'Пётр', 'Петрович', 1);
INSERT INTO public.users VALUES (5, 'admin2', '$2b$10$zVsD9Kw060yxNez7gv5ITuTYOvpW6eKprn2Kem5T0YqJUUHbwJepC', '2025-12-11 21:23:51.092755', true, 'Admin2', '', '', 3);
INSERT INTO public.users VALUES (1, 'ivanov', '$2a$12$9O6eC6ou5RVoEXGtZquYBO7XxlcwOdpvVRVd/23ILOMMBt6OCUutW', '2025-11-08 21:06:50.13428', true, 'Иванов', 'Иван', 'Иванович', 1);
INSERT INTO public.users VALUES (19, 'testTest', '$2b$10$bxkqUCqkDS8b2pDd9MEpL.Xhs8L3WRYDZ0eSHJvW2/UEFvuaYoQjG', '2025-12-25 15:33:28.773461', true, 'testTest', '', '', 1);
INSERT INTO public.users VALUES (16, 'sidorov', '$2b$10$6YVbq.x4lJJwg4JGEKrJmejHoRyf/1od1IE2/4lhSx2pyOOzH861C', '2025-12-11 21:46:58.33611', true, 'Сидоров', 'Сидр', 'Сидрович', 1);
INSERT INTO public.users VALUES (17, 'test', '$2a$06$rjcnLZV9wus5GjUu6RnMben5DYIBiujB7bMnmIGbjfbqQIXlCLqHu', '2025-12-11 21:52:19.357029', true, 'Тестов', 'Тест', 'Тестович', 1);
INSERT INTO public.users VALUES (18, 'block_test', '$2a$06$rsWBtGZcsB3bpw6H3arH0uRe2xqAgA/PpmB7HOVsmxr8tLSvzbHPu', '2025-12-18 18:37:39.455208', false, 'Тест', 'Деактивации', 'и', 2);
INSERT INTO public.users VALUES (22, 'test1', '$2a$06$4jHOQvOB3FCFIiSRM0qK9.Afn5niXo8hKqx3MfIkQtrPGBOInQHSC', '2026-03-15 11:50:47.48715', false, 'ну', 'наконец-то', '😭', 1);
INSERT INTO public.users VALUES (23, 'test52', '$2b$10$uLPA.G/kOqfxPEIfVyRSZurPzg9s0S2XgFZ4Ta2Zv6OkrafdipqKW', '2026-04-17 15:54:10.358511', true, 'Ещё', 'Один', 'Тест_создания', 2);


--
-- TOC entry 5041 (class 0 OID 0)
-- Dependencies: 231
-- Name: assignment_attachments_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignment_attachments_attachment_id_seq', 1, false);


--
-- TOC entry 5042 (class 0 OID 0)
-- Dependencies: 229
-- Name: assignments_assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assignments_assignment_id_seq', 5, true);


--
-- TOC entry 5043 (class 0 OID 0)
-- Dependencies: 225
-- Name: audit_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_log_log_id_seq', 145, true);


--
-- TOC entry 5044 (class 0 OID 0)
-- Dependencies: 227
-- Name: experiment_reviews_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.experiment_reviews_review_id_seq', 16, true);


--
-- TOC entry 5045 (class 0 OID 0)
-- Dependencies: 220
-- Name: experiments_experiment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.experiments_experiment_id_seq', 69, true);


--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 222
-- Name: reagents_reagent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reagents_reagent_id_seq', 1, true);


--
-- TOC entry 5047 (class 0 OID 0)
-- Dependencies: 234
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 3, true);


--
-- TOC entry 5048 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 23, true);


--
-- TOC entry 4845 (class 2606 OID 24773)
-- Name: assignment_attachments assignment_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_attachments
    ADD CONSTRAINT assignment_attachments_pkey PRIMARY KEY (attachment_id);


--
-- TOC entry 4847 (class 2606 OID 24783)
-- Name: assignment_reagents assignment_reagents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_reagents
    ADD CONSTRAINT assignment_reagents_pkey PRIMARY KEY (assignment_id, reagent_id);


--
-- TOC entry 4843 (class 2606 OID 24762)
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (assignment_id);


--
-- TOC entry 4838 (class 2606 OID 24662)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4836 (class 2606 OID 16599)
-- Name: experiment_reagents experiment_reagents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiment_reagents
    ADD CONSTRAINT experiment_reagents_pkey PRIMARY KEY (experiment_id, reagent_id);


--
-- TOC entry 4840 (class 2606 OID 24685)
-- Name: experiment_reviews experiment_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiment_reviews
    ADD CONSTRAINT experiment_reviews_pkey PRIMARY KEY (review_id);


--
-- TOC entry 4830 (class 2606 OID 16575)
-- Name: experiments experiments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiments
    ADD CONSTRAINT experiments_pkey PRIMARY KEY (experiment_id);


--
-- TOC entry 4832 (class 2606 OID 16591)
-- Name: reagents reagents_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reagents
    ADD CONSTRAINT reagents_name_key UNIQUE (name);


--
-- TOC entry 4834 (class 2606 OID 16589)
-- Name: reagents reagents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reagents
    ADD CONSTRAINT reagents_pkey PRIMARY KEY (reagent_id);


--
-- TOC entry 4849 (class 2606 OID 24806)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4851 (class 2606 OID 24808)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4826 (class 2606 OID 16564)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4828 (class 2606 OID 16566)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4841 (class 1259 OID 24701)
-- Name: idx_experiment_single_review; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_experiment_single_review ON public.experiment_reviews USING btree (experiment_id);


--
-- TOC entry 4863 (class 2620 OID 24669)
-- Name: experiment_reagents trigger_experiment_reagents_audit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_experiment_reagents_audit AFTER INSERT OR DELETE OR UPDATE ON public.experiment_reagents FOR EACH ROW EXECUTE FUNCTION public.log_audit();


--
-- TOC entry 4862 (class 2620 OID 24668)
-- Name: experiments trigger_experiments_audit; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_experiments_audit AFTER INSERT OR DELETE OR UPDATE ON public.experiments FOR EACH ROW EXECUTE FUNCTION public.log_audit();


--
-- TOC entry 4859 (class 2606 OID 24774)
-- Name: assignment_attachments assignment_attachments_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_attachments
    ADD CONSTRAINT assignment_attachments_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(assignment_id) ON DELETE CASCADE;


--
-- TOC entry 4860 (class 2606 OID 24784)
-- Name: assignment_reagents assignment_reagents_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_reagents
    ADD CONSTRAINT assignment_reagents_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(assignment_id) ON DELETE CASCADE;


--
-- TOC entry 4861 (class 2606 OID 24789)
-- Name: assignment_reagents assignment_reagents_reagent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_reagents
    ADD CONSTRAINT assignment_reagents_reagent_id_fkey FOREIGN KEY (reagent_id) REFERENCES public.reagents(reagent_id);


--
-- TOC entry 4856 (class 2606 OID 24663)
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 4854 (class 2606 OID 16600)
-- Name: experiment_reagents experiment_reagents_experiment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiment_reagents
    ADD CONSTRAINT experiment_reagents_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES public.experiments(experiment_id) ON DELETE CASCADE;


--
-- TOC entry 4855 (class 2606 OID 16605)
-- Name: experiment_reagents experiment_reagents_reagent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiment_reagents
    ADD CONSTRAINT experiment_reagents_reagent_id_fkey FOREIGN KEY (reagent_id) REFERENCES public.reagents(reagent_id) ON DELETE CASCADE;


--
-- TOC entry 4857 (class 2606 OID 24686)
-- Name: experiment_reviews experiment_reviews_experiment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiment_reviews
    ADD CONSTRAINT experiment_reviews_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES public.experiments(experiment_id) ON DELETE CASCADE;


--
-- TOC entry 4858 (class 2606 OID 24691)
-- Name: experiment_reviews experiment_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiment_reviews
    ADD CONSTRAINT experiment_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(user_id);


--
-- TOC entry 4853 (class 2606 OID 16576)
-- Name: experiments experiments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiments
    ADD CONSTRAINT experiments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4852 (class 2606 OID 24809)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


-- Completed on 2026-05-02 16:58:15

--
-- PostgreSQL database dump complete
--


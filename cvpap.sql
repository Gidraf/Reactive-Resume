--
-- PostgreSQL database dump
--

-- Dumped from database version 15.6 (Homebrew)
-- Dumped by pg_dump version 15.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: gidraf
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO gidraf;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: gidraf
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Provider; Type: TYPE; Schema: public; Owner: gidraf
--

CREATE TYPE public."Provider" AS ENUM (
    'email',
    'github',
    'google'
);


ALTER TYPE public."Provider" OWNER TO gidraf;

--
-- Name: Visibility; Type: TYPE; Schema: public; Owner: gidraf
--

CREATE TYPE public."Visibility" AS ENUM (
    'public',
    'private'
);


ALTER TYPE public."Visibility" OWNER TO gidraf;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Resume; Type: TABLE; Schema: public; Owner: gidraf
--

CREATE TABLE public."Resume" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    visibility public."Visibility" DEFAULT 'private'::public."Visibility" NOT NULL,
    locked boolean DEFAULT false NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Resume" OWNER TO gidraf;

--
-- Name: Secrets; Type: TABLE; Schema: public; Owner: gidraf
--

CREATE TABLE public."Secrets" (
    id text NOT NULL,
    password text,
    "lastSignedIn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "verificationToken" text,
    "twoFactorSecret" text,
    "twoFactorBackupCodes" text[] DEFAULT ARRAY[]::text[],
    "refreshToken" text,
    "resetToken" text,
    "userId" text NOT NULL
);


ALTER TABLE public."Secrets" OWNER TO gidraf;

--
-- Name: Statistics; Type: TABLE; Schema: public; Owner: gidraf
--

CREATE TABLE public."Statistics" (
    id text NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    downloads integer DEFAULT 0 NOT NULL,
    "resumeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Statistics" OWNER TO gidraf;

--
-- Name: User; Type: TABLE; Schema: public; Owner: gidraf
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    picture text,
    username text NOT NULL,
    email text NOT NULL,
    locale text DEFAULT 'en-US'::text NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    provider public."Provider" NOT NULL,
    "whatsappUserId" text
);


ALTER TABLE public."User" OWNER TO gidraf;

--
-- Name: WhatsappUser; Type: TABLE; Schema: public; Owner: gidraf
--

CREATE TABLE public."WhatsappUser" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "whatsappProfilePicture" text,
    "whatsappName" text NOT NULL,
    "whatsappNumber" text NOT NULL,
    "lastSessionSelection" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "currentSession" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "previewUrl" text NOT NULL,
    status jsonb DEFAULT '{}'::jsonb NOT NULL,
    "lastCvDetails" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "lastjobDescription" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "loginToken" text NOT NULL
);


ALTER TABLE public."WhatsappUser" OWNER TO gidraf;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: gidraf
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO gidraf;

--
-- Name: chat_history; Type: TABLE; Schema: public; Owner: gidraf
--

CREATE TABLE public.chat_history (
    id integer NOT NULL,
    session_id uuid NOT NULL,
    message jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_history OWNER TO gidraf;

--
-- Name: chat_history_id_seq; Type: SEQUENCE; Schema: public; Owner: gidraf
--

CREATE SEQUENCE public.chat_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_history_id_seq OWNER TO gidraf;

--
-- Name: chat_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gidraf
--

ALTER SEQUENCE public.chat_history_id_seq OWNED BY public.chat_history.id;


--
-- Name: chat_history id; Type: DEFAULT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public.chat_history ALTER COLUMN id SET DEFAULT nextval('public.chat_history_id_seq'::regclass);


--
-- Data for Name: Resume; Type: TABLE DATA; Schema: public; Owner: gidraf
--

COPY public."Resume" (id, title, slug, data, visibility, locked, "userId", "createdAt", "updatedAt") FROM stdin;
clwc4ke11000zo5ulkgufv6us	Senior Frontend Developer	2990a8fb-4de1-400b-a7a2-ff571fff7be0	{"basics": {"url": null, "name": "Gidraf Orenjaa Mtang'e", "email": "orenjagidraf@gmail.com", "phone": "254791186712@s.whatsapp.net", "photo": {"url": "", "size": 64, "effects": {"border": false, "hidden": false, "grayscale": false}, "aspectRatio": 1, "borderRadius": 0}, "headline": "Senior Frontend Developer", "location": "", "customFields": []}, "metadata": {"css": {"value": ".section {\\n\\toutline: 1px solid #000;\\n\\toutline-offset: 4px;\\n}", "visible": false}, "page": {"format": "a4", "margin": 18, "options": {"breakLine": true, "pageNumbers": true}}, "notes": "", "theme": {"text": "#000000", "primary": "#dc2626", "background": "#ffffff"}, "layout": [[["profiles", "summary", "experience", "education", "projects", "volunteer", "references"], ["skills", "interests", "certifications", "awards", "publications", "languages"]]], "template": "Nairobi", "typography": {"font": {"size": 14, "family": "IBM Plex Serif", "subset": "latin", "variants": ["regular", "italic", "600"]}, "hideIcons": false, "lineHeight": 1.5, "underlineLinks": true}}, "sections": {"awards": {"id": "awards", "name": "Awards", "type": "basic", "items": [{"id": "clwc4ke0u000so5uliagu8jp7", "url": {"href": "https://andela.com/author/gidraf-orenja/", "label": "Andela's insight blogs"}, "date": "Feb 2021 - Jan 2022", "title": "Published on Andela's insight blogs", "awarder": "Andela", "summary": "Published 3 articles on Andela's insight blogs", "visible": true}, {"id": "clwc4ke0u000to5ultss9sgit", "url": {"href": "", "label": "Andela Bootcamp Challenge"}, "date": "Feb 2019 - Jan 2020", "title": "Won the Andela Bootcamp Challenge", "awarder": "Andela", "summary": "Won the Andela Bootcamp Challenge", "visible": true}], "columns": 1, "visible": true}, "skills": {"id": "skills", "name": "Skills", "items": [{"id": "clwc4ke0n0008o5ulk0cbtlfv", "name": "Web Development", "level": 4, "visible": true, "keywords": ["React", "Redux", "HTML", "CSS", "JavaScript"], "description": "I have experience in building web applications using React, Redux, HTML, CSS and JavaScript."}, {"id": "clwc4ke0n0009o5ulb5ivfris", "name": "Mobile Development", "level": 4, "visible": true, "keywords": ["React Native", "Cordova", "Java", "Kotlin", "Android"], "description": "I have experience in building mobile applications using React Native, Cordova, Java, Kotlin and Android."}, {"id": "clwc4ke0n000ao5ulnb46ngr7", "name": "Databases", "level": 5, "visible": true, "keywords": ["PostgreSQL", "MySQL", "MongoDB", "Cassandra"], "description": "I have experience in working with PostgreSQL, MySQL, MongoDB and Cassandra databases."}, {"id": "clwc4ke0n000bo5ulcpzfyev3", "name": "Server Side Frameworks", "level": 4, "visible": true, "keywords": ["Express", "Django", "Flask", "Spring Boot", "FastAPI"], "description": "I have experience in working with Express, Django, Flask, Spring Boot and FastAPI server side frameworks."}, {"id": "clwc4ke0n000co5ul97t90los", "name": "DevOps", "level": 3, "visible": true, "keywords": ["Google Cloud Platform", "Docker", "Continuous Deployment"], "description": "I have experience in working with Google Cloud Platform, Docker and Continuous Deployment."}, {"id": "clwc4ke0n000do5ulkpiwsg2h", "name": "Testing", "level": 3, "visible": true, "keywords": ["Selenium", "Puppeteer", "Playwright", "Jest", "Pytest"], "description": "I have experience in writing unit and integration tests using Selenium, Puppeteer, Playwright, Jest and Pytest."}, {"id": "clwc4ke0n000eo5ulmb5rh3ka", "name": "Methodologies", "level": 4, "visible": true, "keywords": ["Agile", "Test-Driven Development", "Behavior-Driven Development"], "description": "I have experience in working with Agile, Test-Driven Development and Behavior-Driven Development methodologies."}, {"id": "clwc4ke0n000fo5ulmkcnklcc", "name": "Programming Languages", "level": 3, "visible": true, "keywords": ["Java", "Python", "NodeJs/JavaScript", "Kotlin"], "description": "I have experience in programming in Java, Python, NodeJs/JavaScript and Kotlin."}, {"id": "clwc4ke0o000go5ulungt3ydf", "name": "Chromium/Gecko/Webkit Extensions", "level": 4, "visible": true, "keywords": ["REST", "GraphQL"], "description": "I have experience in working with Chromium/Gecko/Webkit Extensions, REST and GraphQL."}], "columns": 1, "visible": true}, "projects": {"id": "projects", "name": "Projects", "type": "basic", "items": [{"id": "clwc4ke0q000ho5ulmi5dvmk9", "url": {"href": "https://apps.apple.com/ke/app/co-operative-bank-omni/id1585000000", "label": "App Store"}, "date": "Sept 2021 - Present", "name": "Cooperative bank Omni mobile app", "summary": "- Built and maintained the Cooperative bank Omni mobile app for both IOS, android and Huawei phones.\\n        - Responsible to fixing issues arise on the app and release an update of the app.\\n        - Responsible for maintaining the design/ feel and look of the bank’s web app.", "keywords": ["React Native", "Java", "Kotlin", "Android", "IOS", "Huawei", "Docker", "Google Cloud Platform", "Continuous Deployment"], "description": "I am responsible for building and maintain the Cooperative bank Omni mobile app for both IOS, android and Huawei phones."}, {"id": "clwc4ke0q000io5ulcu7knxb7", "url": {"href": "https://www.nikodigi.co.ke/", "label": "Niko Digi FMS"}, "date": "Oct 2019 - May 2020", "name": "Niko Digi FMS", "summary": "- Worked at Niko Digi  FMS  that would Sacco’s manage their financial data, it also helped the Sacco’s with sending of messages to it’s members.\\n        - Worked on BodaCare, a mobile rider hailing app as an individual contributor in a team of 4 people.\\n        - Worked on a Gateway feature for Miliki System POS app; I learned how to encode and decode Fintech Binary Technology", "keywords": ["Java", "Spring Boot", "Postgresql", "Docker", "Google Cloud Platform", "Continuous Deployment"], "description": "I worked at Niko Digi  FMS  that would Sacco’s manage their financial data, it also helped the Sacco’s with sending of messages to it’s members"}], "columns": 1, "visible": true}, "education": {"id": "education", "name": "Education", "items": [{"id": "clwc4ke0m0006o5ulhvzz4bj2", "url": {"href": "https://en.wikipedia.org/wiki/Kenya_Certificate_of_Secondary_Education", "label": "O-Levels"}, "area": "Computer Science", "date": "2014 - 2016", "score": "B-", "degree": "O-Levels", "summary": "- Learnt about Data Structures and Algorithms\\n- Learnt about Computer Architecture\\n- Learnt about Computer Networks\\n- Learnt about Operating Systems\\n- Learnt about Software Engineering", "visible": true, "studyType": "Full-time", "institution": "St Columbans Secondary School"}, {"id": "clwc4ke0m0007o5ul2r3rqpw4", "url": {"href": "https://andela.com/training/software-engineering/", "label": "Software Engineering Training"}, "area": "Software Engineering", "date": "2018 - 2019", "score": "N/A", "degree": "N/A", "summary": "- Learnt about Software Design\\n- Learnt about Software Development\\n- Learnt about Software Testing\\n- Learnt about Software Deployment\\n- Learnt about Software Maintenance", "visible": true, "studyType": "Full-time", "institution": "Andela Kenya"}], "columns": 1, "visible": true}, "interests": {"id": "interests", "name": "Interests", "type": "basic", "items": [{"id": "clwc4ke0w000uo5ul80r7p4r5", "name": "Reading", "keywords": ["books", "literature", "writing"]}, {"id": "clwc4ke0w000vo5ulsdmlsrhc", "name": "Programming", "keywords": ["coding", "software development", "algorithms"]}, {"id": "clwc4ke0w000wo5uljp8zkd6f", "name": "Technology", "keywords": ["gadgets", "innovation", "science"]}], "columns": 2, "visible": true}, "languages": {"id": "languages", "name": "Languages", "type": "basic", "items": [{"id": "clwc4ke0r000lo5ul210kps12", "name": "English", "level": 3, "visible": true, "description": ""}, {"id": "clwc4ke0r000mo5uleev80wad", "name": "Swahili", "level": 5, "visible": true, "description": ""}], "columns": 2, "visible": true}, "volunteer": {"id": "volunteer", "name": "Volunteer Experience", "type": "basic", "items": [{"id": "clwc4ke0r000jo5ul1wcydqlu", "url": {"href": "https://www.moringaschool.com/", "label": "Moringa School"}, "date": "Feb 2020 - Jan 2021", "summary": "Mentored students on web development technologies", "visible": true, "location": "Nairobi, Kenya", "position": "Mentor", "organization": "Moringa School"}, {"id": "clwc4ke0r000ko5ulatw4bcqp", "url": {"href": "https://andela.com/", "label": "Andela"}, "date": "Feb 2021 - Present", "summary": "Mentored junior developers on software engineering", "visible": true, "location": "Nairobi, Kenya", "position": "Mentor", "organization": "Andela"}], "columns": 1, "visible": true}, "experience": {"id": "experience", "name": "Work Experience", "items": [{"id": "clwc4ke0m0003o5ul8gf19vvz", "url": {"href": "https://www.linkedin.com/in/gidraf-orenja-a2287917b/", "label": "LinkedIn"}, "date": "Oct 2019 - May 2020", "company": "Tracom Services", "summary": "Developed and maintained Niko Digi FMS that helped Sacco's manage their financial data, also helped with sending of messages to it's members. Worked on BodaCare, a mobile rider hailing app as an individual contributor in a team of 4 people. Worked on a Gateway feature for Miliki System POS app; learned how to encode and decode Fintech Binary Technology.", "visible": true, "location": "Nairobi, Kenya", "position": "Software Developer"}, {"id": "clwc4ke0m0004o5uldzqe0lzm", "url": {"href": "https://www.linkedin.com/in/gidraf-orenja-a2287917b/", "label": "LinkedIn"}, "date": "Oct 2021 - Present", "company": "Co-operative Bank", "summary": "Developed and maintained the Cooperative bank Omni mobile app for both IOS, android and Huawei phones. Responsible for fixing issues arise on the app and release an update of the app. Responsible for maintaining the design/ feel and look of the bank's web app.", "visible": true, "location": "Nairobi, Kenya", "position": "Senior Frontend Developer"}, {"id": "clwc4ke0m0005o5ulp70bnkdm", "url": {"href": "https://www.linkedin.com/in/gidraf-orenja-a2287917b/", "label": "LinkedIn"}, "date": "Oct 2018 - November 2019", "company": "Andela Kenya", "summary": "Developed applications used in inside the organization. Learned collaborations and team skills. Gained communication skills.", "visible": true, "location": "Nairobi, Kenya", "position": "Junior Software Developer"}], "columns": 1, "visible": true}, "references": {"id": "references", "name": "References", "type": "basic", "items": [{"id": "clwc4ke0x000xo5ulg19ahe3x", "name": "JOHN DOE", "summary": "- Saw me grow from a Junior Software Developer to a Senior Frontend Developer in a short period of time.\\n      - Highlighted my strong technical skills and ability to learn new technologies quickly.\\n      - Noted my ability to work independently and as part of a team.", "visible": true, "description": "Technical Lead at Andela"}, {"id": "clwc4ke0x000yo5uloy94wpzp", "name": "MARY ROE", "summary": "- Saw me develop a small web server that made connection to the database and fetch data.\\n      - Noted my ability to work under pressure and meet deadlines.\\n      - Appreciated my willingness to go the extra mile.", "visible": true, "description": "Product Manager at Tracom Services"}], "columns": 2, "visible": true}, "publications": {"id": "publications", "name": "Publications", "type": "basic", "items": [{"id": "clwc4ke0s000no5ulgkzgezgz", "url": {"href": "https://medium.com/the-andela-way/create-the-simplest-django-and-react-server-on-your-phone-fd53ea30c5e8", "label": "Article"}, "date": "Feb - Jan", "name": "How to create the simplest Django and React server on your phone", "summary": "", "visible": true, "publisher": "Medium"}, {"id": "clwc4ke0s000oo5ulc8pd2md1", "url": {"href": "https://medium.com/the-andela-way/build-a-simple-text-to-speech-web-app-with-python-flask-and-termux-a51701f1fea0", "label": "Article"}, "date": "Feb - Jan", "name": "How to build a simple text-to-speech web app with Python Flask and Termux", "summary": "", "visible": true, "publisher": "Medium"}, {"id": "clwc4ke0s000po5ulwzzll5oe", "url": {"href": "https://www.nation.co.ke/lifestyle/mynetwork/How-our-self-taught-careers-took-off-and-gained-ground/3141096-5366476lcthm5/index.html", "label": "Article"}, "date": "Feb - Jan", "name": "How our self-taught careers took off and gained ground", "summary": "", "visible": true, "publisher": "Nation.co.ke"}], "columns": 1, "visible": true}, "certifications": {"id": "certifications", "name": "Certifications", "type": "basic", "items": [{"id": "clwc4ke0s000qo5uld9mcxaj5", "url": "https://andela.com/training/", "date": "Oct 2018 - Nov 2019", "name": "Software Engineering Training", "issuer": "Andela Kenya", "summary": "I was taught the fundamentals of software development.", "visible": true}, {"id": "clwc4ke0t000ro5uledvkh31l", "url": "https://knec.ac.ke/", "date": "2016 - 2018", "name": "O-Levels (Kenya Certificate of Secondary Education)", "issuer": "St Columbans Secondary School", "summary": "I attained a grade B- in my O-Levels.", "visible": true}], "columns": 1, "visible": true}}}	private	f	clwc4kdzr0000o5ul3d6ez3ko	2024-05-18 16:05:16.626	2024-05-18 16:05:16.626
\.


--
-- Data for Name: Secrets; Type: TABLE DATA; Schema: public; Owner: gidraf
--

COPY public."Secrets" (id, password, "lastSignedIn", "verificationToken", "twoFactorSecret", "twoFactorBackupCodes", "refreshToken", "resetToken", "userId") FROM stdin;
clwc4lhyu0001vwuq8fr1y6k9	kk	2024-05-18 13:13:25.125	\N	\N	{}	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsd2M0a2R6cjAwMDBvNXVsM2Q2ZXoza28iLCJpc1R3b0ZhY3RvckF1dGgiOmZhbHNlLCJpYXQiOjE3MTYwMzgwMDUsImV4cCI6MTc0NzE0MjAwNX0.YUs2ft5bxnBV62S4mG1F4pdu6fW3KNv_giqcs3Mr6vQ	\N	clwc4kdzr0000o5ul3d6ez3ko
\.


--
-- Data for Name: Statistics; Type: TABLE DATA; Schema: public; Owner: gidraf
--

COPY public."Statistics" (id, views, downloads, "resumeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: gidraf
--

COPY public."User" (id, name, picture, username, email, locale, "emailVerified", "twoFactorEnabled", "createdAt", "updatedAt", provider, "whatsappUserId") FROM stdin;
clwc4kdzr0000o5ul3d6ez3ko	Gidraf Orenjaa	\N	orenjagidraf_gmail_com	orenjagidraf@gmail.com	en-US	f	f	2024-05-18 16:05:16.608	2024-05-18 16:05:16.608	email	05e2cb1f-7bc4-4172-8f02-b0ed76770e15
\.


--
-- Data for Name: WhatsappUser; Type: TABLE DATA; Schema: public; Owner: gidraf
--

COPY public."WhatsappUser" (id, "createdAt", "updatedAt", "whatsappProfilePicture", "whatsappName", "whatsappNumber", "lastSessionSelection", "currentSession", "previewUrl", status, "lastCvDetails", "lastjobDescription", "loginToken") FROM stdin;
05e2cb1f-7bc4-4172-8f02-b0ed76770e15	2024-05-18 13:00:40.67	2024-05-18 13:00:40.668	\N	G	254791186712@s.whatsapp.net	{"number": "1"}	{"step": "Selecting Template"}		{"status": "Pending Processing"}	{"txt": "pdf", "url": "http://localhost:9000/05e2cb1f-7bc4-4172-8f02-b0ed76770e15/resume-pdf/Gidraf Orenja Latest(1)-1.pdf", "filename": "Gidraf Orenja Latest(1)-1.pdf", "filepath": "05e2cb1f-7bc4-4172-8f02-b0ed76770e15/resume-pdf/Gidraf Orenja Latest(1)-1.pdf", "mimetype": "application/pdf", "template": {"price": {"total": 150000, "currency": "KES"}, "products": [{"id": "7062303760533562", "name": "Nairobi", "price": 150000, "currency": "KES", "imageUrl": "https://media-lhr8-2.cdn.whatsapp.net/v/t45.5328-4/436431045_927429572262458_799324554985735366_n.jpg?stp=dst-jpg_p100x100&ccb=1-7&_nc_sid=b16ce9&_nc_ohc=uXik5kaIyH4Q7kNvgGH_c7M&_nc_ad=z-m&_nc_cid=0&_nc_ht=media-lhr8-2.cdn.whatsapp.net&oh=01_Q5AaIFg11dMpK8Q-v5VcvVt4xYwVWxQheIgszXzu_1mfN6Ic&oe=664E92BD", "quantity": 1}]}, "textData": ""}	{"url": "", "mimetype": "", "textData": ""}	kk
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: gidraf
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
604cea14-9abb-4815-bb7f-9a9969c43e5e	e758f796269a0d7bfd52de20b9c2ee9199ad8672999e48db6e5710a364adc404	2024-05-18 13:49:41.290062+03	20231121234455_initialize_tables	\N	\N	2024-05-18 13:49:41.264756+03	1
4bfd021e-0832-4fd8-80f9-7a1d0dc9d428	0e5fad8a8cd852e6bd270e2bf53a8ea02a0e26516d720f4bb257090721541d73	2024-05-18 13:49:41.30183+03	20240412181955_create_whatsapp_user	\N	\N	2024-05-18 13:49:41.290933+03	1
1e609b77-c0bf-4f9a-9d5d-9b6158946ff6	d20d5850a70baacd113494535c7a932720d18166766c6fceb476960dad826462	2024-05-18 13:49:41.312831+03	20240421132910_	\N	\N	2024-05-18 13:49:41.302868+03	1
8a0b5c33-b62f-4051-9396-5086abd1fbe2	cc054c197ea1be48e180eb48fb6b44ad305e8e74393a9d0763e699ea922f013d	2024-05-18 13:49:41.321435+03	20240421133328_	\N	\N	2024-05-18 13:49:41.314426+03	1
70a80854-aa5d-4f6e-a519-3f29a7326080	e427f5b5f67d2cb3bdef9a74bf9298efd6e4d57e2b165613b1804327d7425236	2024-05-18 13:49:41.336179+03	20240505101746_add_statistics_table	\N	\N	2024-05-18 13:49:41.322225+03	1
e7ea74fc-6fce-466f-a26a-20d67976f634	be53b38adb832e1d3bc74dd357be2caeb8a09e03b73e4626c44b98c3e51ceaf0	2024-05-18 13:49:41.339692+03	20240507090221_make_last_signed_in_non_null	\N	\N	2024-05-18 13:49:41.336909+03	1
4aa9831b-31cf-46ff-a399-3158fea5196d	5735c4b8e03a8b8b7050bca97751588ee4d3254c11fdd0c751c8ee7b022e0cf2	2024-05-18 13:49:47.216363+03	20240518104947_latest	\N	\N	2024-05-18 13:49:47.185115+03	1
d055f0aa-1eec-4b4a-8810-bf3ae097e064	67a5d7ed79c2f04719255e88a6492f2a00617fcf06317b278b5be1a5ae0e69e7	2024-05-18 14:02:02.341437+03	20240518110202_statistics	\N	\N	2024-05-18 14:02:02.28342+03	1
\.


--
-- Data for Name: chat_history; Type: TABLE DATA; Schema: public; Owner: gidraf
--

COPY public.chat_history (id, session_id, message, created_at) FROM stdin;
1	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "system", "content": "Given a chat history and the latest user question which might reference context in the chat history, always return response based on the user question and our cuurent context The answers should be a follow up of most previous answer or question from the user, Return the answer as per organisation context and the user questions and responses.", "additional_kwargs": {}, "response_metadata": {}}, "type": "system"}	2024-05-18 16:06:04.76015+03
2	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "ai", "content": "Hello! How can I assist you today? 😊", "example": false, "tool_calls": [], "additional_kwargs": {}, "response_metadata": {}, "invalid_tool_calls": []}, "type": "ai"}	2024-05-18 16:06:04.76015+03
3	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "human", "content": "Hi", "example": false, "additional_kwargs": {}, "response_metadata": {}}, "type": "human"}	2024-05-18 16:06:04.76015+03
4	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "system", "content": "Given a chat history and the latest user question which might reference context in the chat history, always return response based on the user question and our cuurent context The answers should be a follow up of most previous answer or question from the user, Return the answer as per organisation context and the user questions and responses.", "additional_kwargs": {}, "response_metadata": {}}, "type": "system"}	2024-05-18 16:06:34.979184+03
5	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "ai", "content": "Thank you for your interest in our services. I can not process your request. Kindly contact our customer care through customer.cvpap@gmail.com. Here is a list of our services:\\n\\n1. Personalized CV/Resume Revamping\\n2. Craft a Cover Letter (Coming Soon)\\n3. Generate an ATS-Optimized CV/Resume (Coming Soon)\\n4. Complimentary CV/Resume Review\\n\\nFeel free to reach out if you have any questions or need assistance with anything else!", "example": false, "tool_calls": [], "additional_kwargs": {}, "response_metadata": {}, "invalid_tool_calls": []}, "type": "ai"}	2024-05-18 16:06:34.979184+03
6	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "human", "content": "1", "example": false, "additional_kwargs": {}, "response_metadata": {}}, "type": "human"}	2024-05-18 16:06:34.979184+03
7	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "system", "content": "Given a chat history and the latest user question which might reference context in the chat history, always return response based on the user question and our cuurent context The answers should be a follow up of most previous answer or question from the user, Return the answer as per organisation context and the user questions and responses.", "additional_kwargs": {}, "response_metadata": {}}, "type": "system"}	2024-05-18 16:07:03.552556+03
8	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "ai", "content": "At CVPAP, we offer personalized CV/Resume revamping services for only 500 Kes. Would you like to revamp your CV to a modern design with us? 😊", "example": false, "tool_calls": [], "additional_kwargs": {}, "response_metadata": {}, "invalid_tool_calls": []}, "type": "ai"}	2024-05-18 16:07:03.552556+03
9	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "human", "content": "1", "example": false, "additional_kwargs": {}, "response_metadata": {}}, "type": "human"}	2024-05-18 16:07:03.552556+03
10	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "system", "content": "Given a chat history and the latest user question which might reference context in the chat history, always return response based on the user question and our cuurent context The answers should be a follow up of most previous answer or question from the user, Return the answer as per organisation context and the user questions and responses.", "additional_kwargs": {}, "response_metadata": {}}, "type": "system"}	2024-05-18 16:07:24.243481+03
11	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "ai", "content": "Great choice! To get started, you can revamp your CV to a modern design instantly via our WhatsApp bot powered by AI. Simply click on this link to begin the process: [Revamp Your CV/Resume](https://wa.me/c/254735143282). If you need any help along the way, feel free to ask! 🌟", "example": false, "tool_calls": [], "additional_kwargs": {}, "response_metadata": {}, "invalid_tool_calls": []}, "type": "ai"}	2024-05-18 16:07:24.243481+03
12	05e2cb1f-7bc4-4172-8f02-b0ed76770e15	{"data": {"id": null, "name": null, "type": "human", "content": "Yes", "example": false, "additional_kwargs": {}, "response_metadata": {}}, "type": "human"}	2024-05-18 16:07:24.243481+03
\.


--
-- Name: chat_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gidraf
--

SELECT pg_catalog.setval('public.chat_history_id_seq', 12, true);


--
-- Name: Resume Resume_pkey; Type: CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public."Resume"
    ADD CONSTRAINT "Resume_pkey" PRIMARY KEY (id);


--
-- Name: Secrets Secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public."Secrets"
    ADD CONSTRAINT "Secrets_pkey" PRIMARY KEY (id);


--
-- Name: Statistics Statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public."Statistics"
    ADD CONSTRAINT "Statistics_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WhatsappUser WhatsappUser_pkey; Type: CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public."WhatsappUser"
    ADD CONSTRAINT "WhatsappUser_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: chat_history chat_history_pkey; Type: CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT chat_history_pkey PRIMARY KEY (id);


--
-- Name: Resume_userId_id_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "Resume_userId_id_key" ON public."Resume" USING btree ("userId", id);


--
-- Name: Resume_userId_idx; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE INDEX "Resume_userId_idx" ON public."Resume" USING btree ("userId");


--
-- Name: Resume_userId_slug_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "Resume_userId_slug_key" ON public."Resume" USING btree ("userId", slug);


--
-- Name: Secrets_resetToken_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "Secrets_resetToken_key" ON public."Secrets" USING btree ("resetToken");


--
-- Name: Secrets_userId_id_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "Secrets_userId_id_key" ON public."Secrets" USING btree ("userId", id);


--
-- Name: Secrets_userId_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "Secrets_userId_key" ON public."Secrets" USING btree ("userId");


--
-- Name: Statistics_resumeId_id_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "Statistics_resumeId_id_key" ON public."Statistics" USING btree ("resumeId", id);


--
-- Name: Statistics_resumeId_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "Statistics_resumeId_key" ON public."Statistics" USING btree ("resumeId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_id_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "User_id_key" ON public."User" USING btree (id);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: User_whatsappUserId_idx; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE INDEX "User_whatsappUserId_idx" ON public."User" USING btree ("whatsappUserId");


--
-- Name: WhatsappUser_id_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "WhatsappUser_id_key" ON public."WhatsappUser" USING btree (id);


--
-- Name: WhatsappUser_whatsappNumber_key; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE UNIQUE INDEX "WhatsappUser_whatsappNumber_key" ON public."WhatsappUser" USING btree ("whatsappNumber");


--
-- Name: idx_chat_history_session_id; Type: INDEX; Schema: public; Owner: gidraf
--

CREATE INDEX idx_chat_history_session_id ON public.chat_history USING btree (session_id);


--
-- Name: Resume Resume_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public."Resume"
    ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Secrets Secrets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public."Secrets"
    ADD CONSTRAINT "Secrets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Statistics Statistics_resumeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public."Statistics"
    ADD CONSTRAINT "Statistics_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES public."Resume"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_whatsappUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gidraf
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_whatsappUserId_fkey" FOREIGN KEY ("whatsappUserId") REFERENCES public."WhatsappUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: gidraf
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--


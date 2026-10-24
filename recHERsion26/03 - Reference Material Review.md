---
tags:
  - hackathon
  - recHERsion26
  - references
created: 2026-10-24
---
# Review of the shortlisted reference links

Back to [[00 - Rulebook & Problem Statements]]. Stars and licences come from the GitHub API, checked 24 Oct 2026.

## Summary
| # | Link | PS | Licence | Verdict |
|---|---|---|---|---|
| 1 | MDPI *Sensors* review | PS2 | CC BY 4.0 | Cite it, and reuse its SOS framework as the architecture |
| 2 | NHS Wales Women's Health | PS1 | © NHS Wales | Link to it as a trusted source; borrow its accessibility ideas |
| 3 | Femora | PS1 | MIT (the README contradicts this) | Cycle-prediction code you can reuse **with credit** |
| 4 | vSafe | PS2 | MIT | SOS, shake-to-alert and fake-call patterns you can reuse **with credit** |
| 5 | WomenShield | PS2 | **None**, and it looks re-uploaded | **Don't reuse the code** |
| 6 | Proem | indirect PS1 | MIT mono repo | Inspiration only |
| 7 | Kindr Health | PS1 | CC BY 4.0 | Statistics for the pitch only; no datasets released yet |
| 8 | data.gov NIH | mostly neither | varies | Use NSFG, SWAN, PhysioNet CTG and the Chicago WHRS instead |

---

## 1. MDPI Sensors: assault detection review (PS2)
**Bhuvaneswari, V.S.S.S. & Thangamuthu, M. (2025).** *Towards Intelligent Safety: A Systematic Review on Assault Detection and Technologies.* Sensors 25(13):3985. DOI [10.3390/s25133985](https://doi.org/10.3390/s25133985). Open access at [Europe PMC](https://europepmc.org/articles/PMC12251837).
- **Method:** systematic review of studies from 2015 to 2024. It groups them into four themes: wearables, IoT attack detection, GIS safety frameworks, and AI mobile apps.
- **Main idea:** a layered **SOS framework**:
  1. **Sensors:** wearables tracking pulse, pressure and motion.
  2. **Edge AI:** detects distress on the device and filters out false alarms.
  3. **Connectivity:** BLE, NB-IoT or LoRaWAN.
  4. **Response:** alerts to contacts, police and health workers, plus GIS location, a chatbot that rates how serious the situation is, and nearby volunteers.
  5. **Security:** end-to-end encryption and GDPR/HIPAA compliance.
- **Open problems it names:** false positives, latency (it suggests mixing on-device and cloud processing), privacy, and getting people to adopt the system.
- **Use:** the architecture slide and citations for PS2. The paper has no code or data.

## 2. NHS Wales Women's Health (PS1)
https://womenshealth.nhs.wales/
- Official NHS Wales information site, also available in Welsh.
- **Topics:** periods, endometriosis, contraception, pregnancy, pelvic health, menopause, and violence against women and girls.
- **Accessibility:** a ReadSpeaker "Listen" button that reads pages aloud.
- **No API, dataset or symptom checker.** Link to it and paraphrase rather than copying text.
- **Ideas to borrow:** read-aloud and multilingual support. Both help on the UX & Accessibility criterion.

## 3. Femora (PS1)
https://github.com/LABOSO123/Femora
- A vanilla JS progressive web app for cycle tracking, aimed at users in Kenya.
- **Repo:** 1 star, last pushed Nov 2025.
- **Features:** calendar, symptom and mood logging, ovulation and fertile-window prediction, contraceptive reminders, menopause tracker.
- **Storage:** everything stays in localStorage on the device.
- **"AI" insights:** these are rule-based, not a model.
- **Code worth reusing:** `js/cycle-tracker.js`, `js/calendar.js`.
- **Caveat:** "safe days" based on the calendar method are medically weak. Don't present them as contraception.

## 4. vSafe (PS2)
https://github.com/HARIOM317/vSafe-women-safety-app
- **Stack:** Flutter + Firebase, MIT licence.
- **Features:** live location, SOS, shake-to-alert, fake call, chatbot, emergency contacts.
- **Caveats:**
  - Its dependencies date from 2023: `contacts_service` is no longer maintained and the Firebase packages are old versions, so expect upgrade work.
  - These features are now common in student projects, so they score low on innovation.

## 5. WomenShield (PS2)
https://github.com/paarthsoni/WomenShield
- It appears to be a re-upload of [HardikSJain/WomenShield](https://github.com/HardikSJain/WomenShield).
- **Neither repo has a licence**, which means all rights are reserved. Use it for UX ideas at most.

## 6. Proem (indirect PS1)
https://proem.ai/
- An AI platform that summarises and answers questions from research papers, with citations.
- Open source as [proemial/mono](https://github.com/proemial/mono) (MIT). I didn't inspect the code.
- **No public API.** To get evidence-backed answers in your app, call the PubMed / Europe PMC APIs and an LLM yourself.

## 7. Kindr Health (PS1, menopause)
https://kindr.health/data#datasets
- A commercial menopause, HRT and GLP-1 telehealth company. Its AI companion is "Ask Dot".
- **Datasets catalog:** promised under CC BY 4.0 but **empty** when checked ("first batch finalised for release").
- **[Menopause Data Hub](https://kindr.health/menopause-statistics):** statistics only (CC BY 4.0), filterable by region including India. Examples:
  - 103M postmenopausal women in India
  - 73% of women with symptoms don't seek treatment
  - 1.2B women in menopause by 2030
- **Caveat:** this is a vendor site and at least one citation is wrong, so **check figures against the original sources** before putting them on slides.

## 8. data.gov (NIH keyword)
The keyword search returns 38 generic NIH repositories (GEO, GenBank and so on). None is specific to women's health.

Better hits:
- **[National Survey of Family Growth](https://catalog.data.gov/dataset/national-survey-of-family-growth):** public microdata on pregnancy, contraception and reproductive health. Best fit for PS1.
- **SWAN (Study of Women's Health Across the Nation):** a long-running menopause cohort. The data is on ICPSR (free login). [catalog entry](https://catalog.data.gov/dataset/blog-data-from-study-of-womens-health-across-the-nation-swan)
- **[PhysioNet](https://catalog.data.gov/dataset/physionet):** includes the CTU-UHB intrapartum CTG database, which is open. Suits a diagnostic ML demo for PS1.
- **[Chicago Women's Health Risk Study](https://catalog.data.gov/dataset/chicago-womens-health-risk-study-1995-1998):** risk factors for lethal intimate-partner violence. Useful for PS2.
- **Skip:** BioLINCC/WHI and MIMIC (need applications or credentials, too slow for 36 hours), and the Sister Study (not public).

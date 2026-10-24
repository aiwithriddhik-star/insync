---
tags:
  - hackathon
  - recHERsion26
  - PS1
  - datasets
  - papers
created: 2026-10-24
---
# PS1: Women's Healthcare datasets, research papers and RAG sources

Back to [[00 - Rulebook & Problem Statements]]. See also [[01 - PS1 Healthcare - Pretrained Models]] and [[03 - Reference Material Review]].

> [!info] How links were checked (24 Oct 2026)
> - **Papers:** DOIs checked through Crossref, arXiv IDs through the arXiv API.
> - **Dataset and source pages:** opened with curl.
> - ⚠ = not fully checked (bot-blocked page, or licence not confirmed).

## 1. Datasets

### Fastest to use (instant download, small, clean)
| Dataset | What's in it | Task | Link | Licence | Fit |
|---|---|---|---|---|---|
| **PCOS clinical (Kottarathil)** | About 541 women from **Kerala, India**; about 40 features (AMH, LH/FSH, follicles, BMI, cycle) | PCOS yes/no | [Kaggle](https://www.kaggle.com/datasets/prasoonkottarathil/polycystic-ovary-syndrome-pcos) | Kaggle ⚠ | ⭐ High: Indian cohort, suits a SHAP-explained screener |
| **Maternal Health Risk (UCI 863)** | 1,014 rows: age, BP, blood sugar, temperature, heart rate → low/mid/high risk | Multiclass | [UCI](https://archive.ics.uci.edu/dataset/863/maternal+health+risk) | CC BY 4.0 | ⭐ High: triage tool for ASHA workers |
| **Menstrual Cycle Data (FedCycleData)** | About 1,600 cycles, about 80 columns (length, luteal phase, peak day, age, BMI) | Predict next cycle or ovulation | [Kaggle](https://www.kaggle.com/datasets/nikitabisht/menstrual-cycle-data) | Kaggle ⚠ | ⭐ High: baseline for cycle prediction |
| **Anemia (CBC)** | Hb, MCH, MCHC, MCV, gender | Anemia yes/no | [Kaggle](https://www.kaggle.com/datasets/biswaranjanrao/anemia-dataset) | ⚠ | High: about 57% of Indian women are anemic (NFHS-5) |
| **Cardiotocography (UCI 193)** | 2,126 fetal heart-rate (CTG) records, 21 features, 3 classes | Fetal state | [UCI](https://archive.ics.uci.edu/dataset/193/cardiotocography) · [Kaggle CSV](https://www.kaggle.com/datasets/andrewmvd/fetal-health-classification) | CC BY 4.0 | High |
| **Breast Cancer Wisconsin (UCI 17)** | 569 rows, 30 features from needle-biopsy cell measurements | Benign or malignant | [UCI](https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic) | CC BY 4.0 | Very common choice; only worth it as an explainability demo |
| **BUSI breast ultrasound** | 780 images (normal/benign/malignant) with masks | Classify or segment | [Kaggle](https://www.kaggle.com/datasets/aryashah2k/breast-ultrasound-images-dataset) · [paper](https://doi.org/10.1016/j.dib.2019.104863) | ⚠ | High for an image demo |
| **Thyroid (UCI 102)** | About 9,000 records | Hypo/hyperthyroid | [UCI](https://archive.ics.uci.edu/dataset/102/thyroid+disease) | CC BY 4.0 | Medium |
| **Cervical Cancer Risk Factors (UCI 383)** | 858 rows, 36 risk factors, many missing values | Risk | [UCI](https://archive.ics.uci.edu/dataset/383/cervical+cancer+risk+factors) | CC BY 4.0 | Medium; sensitive data makes a good privacy talking point |
| **Pima Diabetes** | 768 women, 8 features | Diabetes (not gestational diabetes specifically) | [Kaggle](https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database) | CC0 ⚠ | High |

### Medium fit
- **PCOS ultrasound images:** [Kaggle](https://www.kaggle.com/datasets/anaghachoudhari/pcos-detection-using-ultrasound-images). The labels' origin is unclear, so it's weak clinically.
- **SIPaKMeD Pap-smear images:** 4,049 cells, 5 classes. [link](https://www.cs.uoi.gr/~marina/sipakmed.html)
- **Herlev Pap-smear images:** 917 cells, 7 classes. [link](https://mde-lab.aegean.gr/index.php/downloads)
- **Gestational diabetes (GDM):** [Kaggle](https://www.kaggle.com/datasets/sumathisanthosh/gestational-diabetes-mellitus-gdm-data-set) ⚠ source unclear.
- **Postpartum depression (PPD):**
  - [Kaggle](https://www.kaggle.com/datasets/parvezalmuqtadir2348/postpartum-depression) ⚠
  - [Mendeley (Bangladesh, EPDS/PHQ-9)](https://data.mendeley.com/datasets/4nznnrk8cg/3): South Asian context. Handle the suicide-ideation fields carefully.
- **Endometriosis:** [Kaggle](https://www.kaggle.com/datasets/michaelanietie/endometriosis-dataset). **Synthetic**, so say so openly. The lack of real public endometriosis data is itself a gap worth pitching.

### For context and pitch statistics
- [NITI Aayog NDAP](https://ndap.niti.gov.in/): Indian government datasets, including NFHS indicators.
- [WHO GHO](https://www.who.int/data/gho): global indicators, with an OData API at `https://ghoapi.azureedge.net/api/`.
- [NFHS-5 factsheets](https://rchiips.org/nfhs/) ⚠: state and district PDFs. The underlying microdata needs DHS approval, which takes 1–2 days.

### ❌ Not feasible in 36 hours
- **mcPHASES** ([PhysioNet](https://physionet.org/content/mcphases/1.0.0/)): wearable data plus hormones. Needs a signed data-use agreement (DUA), so only possible if you sign up right now.
- **VinDr-Mammo:** also needs a PhysioNet DUA.
- **CBIS-DDSM / CMMD:** mammography sets of 100+ GB.
- **MIMIC:** needs credentialing.
- **SWAN:** needs an ICPSR login.
- **Apple Women's Health Study:** publications only, no public data.

---

## 2. Research papers

### PCOS and machine learning
1. **Barrera et al. 2023**, *Front. Endocrinol.*: systematic review of ML for PCOS. [doi](https://doi.org/10.3389/fendo.2023.1106625)
   - Finding: studies are small, from single centres, and apply the Rotterdam diagnostic criteria inconsistently.
   - For the build: present the tool as a **screener, not a diagnosis**.
2. **Zad et al. 2024**, *Front. Endocrinol.*: predicting PCOS from health records, AUC about 0.80–0.85. [doi](https://doi.org/10.3389/fendo.2024.1298628)
3. **Wang et al. 2025**, *Radiol Med.*: review of AI in PCOS management. [doi](https://doi.org/10.1007/s11547-025-02032-9)

### Cycle tracking from apps and wearables
4. **Bull et al. 2019**, *npj Digit Med*: 600,000+ real-world cycles. [doi](https://doi.org/10.1038/s41746-019-0152-7)
   - Finding: only about 13% of cycles are 28 days long.
   - For the build: **don't hard-code a 28-day cycle with ovulation on day 14.**
5. **Li et al. 2020**, *npj Digit Med*: self-tracked cycle variation (Clue app data). [doi](https://doi.org/10.1038/s41746-020-0269-8)
   - For the build: add an irregularity flag that prompts PCOS and thyroid awareness.
6. **Li et al. 2023**, *npj Digit Med*: Apple Women's Health Study. [doi](https://doi.org/10.1038/s41746-023-00848-1)
   - Finding: cycle length varies by age, BMI and ethnicity; Asian participants had longer cycles.
7. **Wang et al. 2025**, *Hum Reprod*: Apple wrist-temperature ovulation estimates. [doi](https://doi.org/10.1093/humrep/deaf005)
   - Finding: error of about 1.2 days in about 81% of cycles.
8. **Maijala et al. 2019**, *BMC Women's Health*: Oura ring finger temperature vs oral basal body temperature. [doi](https://doi.org/10.1186/s12905-019-0844-9)
9. **Goodale et al. 2019**, *JMIR*: Ava wristband (heart rate, HRV, temperature). [doi](https://doi.org/10.2196/13404)
   - Finding: fertile window detected with about 90% accuracy.
10. **Alzueta et al. 2022**, *Int J Women's Health*: Oura ring data across cycle phases. [doi](https://doi.org/10.2147/IJWH.S341917)

### Femtech privacy
11. **Shipp & Blasco 2020**, *PoPETs*: "How private is your period?" [doi](https://doi.org/10.2478/popets-2020-0083)
12. **Alfawzan et al. 2022**, *JMIR mHealth*: 87% of women's health apps share user data. [doi](https://doi.org/10.2196/33735)
13. **Dong et al. 2022**, *ASE*: period-tracking app privacy after the Roe v. Wade ruling. [doi](https://doi.org/10.1145/3551349.3561343)
14. **Cao et al. 2024**, *CHI*: "I deleted it after the overturn of Roe v. Wade". [doi](https://doi.org/10.1145/3613904.3642042)
    - For the build: users want **local-only data, an anonymous mode and a PIN lock**.
15. **Mehrnezhad & Almeida 2021**, *CHI*: caring for intimate data. [doi](https://doi.org/10.1145/3411764.3445132)
    - For the build: discreet UI matters on **shared phones**, which are common in India.
16. **Rieke et al. 2020**, *npj Digit Med*: federated learning in health. [doi](https://doi.org/10.1038/s41746-020-00323-1)
    - For the build: angle for India's DPDP Act 2023.

### LLMs for health Q&A: quality and safety
17. **Singhal et al. 2023**, *Nature*: Med-PaLM, with a human evaluation rubric. [doi](https://doi.org/10.1038/s41586-023-06291-2)
18. **Singhal et al. 2025**, *Nat Med*: Med-PaLM 2. [doi](https://doi.org/10.1038/s41591-024-03423-7)
19. **Ayers et al. 2023**, *JAMA IM*: chatbot answers rated more empathetic than physicians' answers. [doi](https://doi.org/10.1001/jamainternmed.2023.1838)
20. **Pal et al. 2023**: Med-HALT hallucination benchmark. [arXiv](https://arxiv.org/abs/2307.15343)
21. **Han et al. 2024**, *NeurIPS*: MedSafetyBench. [arXiv](https://arxiv.org/abs/2403.03744)
22. **Asgari et al. 2025**, *npj Digit Med*: framework for clinical safety and hallucination rates. [doi](https://doi.org/10.1038/s41746-025-01670-7)
23. **Omiye et al. 2023**, *npj Digit Med*: LLMs repeat race-based medicine. [doi](https://doi.org/10.1038/s41746-023-00939-z)
24. **Hager et al. 2024**, *Nat Med*: LLMs fail at autonomous clinical decisions. [doi](https://doi.org/10.1038/s41591-024-03097-1)
    - For the build: **use the LLM to educate and guide, not to diagnose.**

### RAG for medicine
25. **Xiong et al. 2024**, *ACL Findings*: MedRAG / MIRAGE benchmark. [arXiv](https://arxiv.org/abs/2402.13178)
    - Finding: RAG improves accuracy by up to about 18%.
26. **Zakka et al. 2024**, *NEJM AI*: Almanac, grounded clinical answers. [doi](https://doi.org/10.1056/AIoa2300068)
27. **Lewis et al. 2020**, *NeurIPS*: the original RAG paper. [arXiv](https://arxiv.org/abs/2005.11401)

### Symptom checkers
28. **Wallace et al. 2022**, *npj Digit Med*: systematic review. [doi](https://doi.org/10.1038/s41746-022-00667-w)
    - Finding: diagnostic accuracy is low.
    - For the build: show **triage advice, not a diagnosis**.
29. **Semigran et al. 2015**, *BMJ*: symptom checkers listed the correct diagnosis first only about 34% of the time. [doi](https://doi.org/10.1136/bmj.h3480)
30. **Tu et al. 2025**, *Nature*: AMIE, an AI agent for conversational diagnosis. [doi](https://doi.org/10.1038/s41586-025-08866-7)
    - For the build: model the symptom-intake flow on its structured history-taking.

### Maternal health and screening
31. **Ahmed et al. 2020**, LNEE: source paper of the UCI Maternal Health Risk dataset. [doi](https://doi.org/10.1007/978-981-15-2317-5_30)
32. **McKinney et al. 2020**, *Nature*: AI for breast cancer screening. [doi](https://doi.org/10.1038/s41586-019-1799-6)
33. **Lång et al. 2023**, *Lancet Oncol*: MASAI trial; AI cut radiologists' reading workload by 44%. [doi](https://doi.org/10.1016/S1470-2045(23)00298-X)
34. **Hu et al. 2019**, *JNCI*: automated visual evaluation of cervical images, AUC about 0.91. [doi](https://doi.org/10.1093/jnci/djy225)
35. **Xue et al. 2020**, *Int J Cancer*: the same approach using smartphone photos. [doi](https://doi.org/10.1002/ijc.33029)

### Health chatbots in India and other lower-income countries
36. **Wang et al. 2022**, *JMIR*: **SnehAI**, a Hinglish chatbot on sexual and reproductive health in India, reaching about 135k users. [doi](https://doi.org/10.2196/29969)
37. **Mills et al. 2023**, *JMIR*: review of reproductive-health chatbots. Finding: they work best when anonymous, non-judgemental and culturally tailored. [doi](https://doi.org/10.2196/46761)
38. **Ramjee et al. 2024**: **ASHABot**, an LLM bot on WhatsApp for India's ASHA community health workers. [arXiv](https://arxiv.org/abs/2409.10913)

### Explainable AI
39. **Lundberg et al. 2020**, *Nat Mach Intell*: TreeSHAP. [doi](https://doi.org/10.1038/s42256-019-0138-9)
40. **Lundberg & Lee 2017**, *NeurIPS*: the SHAP method. [arXiv](https://arxiv.org/abs/1705.07874)
41. **Lundberg et al. 2018**, *Nat Biomed Eng*: SHAP explanations used in surgery. [doi](https://doi.org/10.1038/s41551-018-0304-0)

---

## 3. Knowledge sources for RAG
| Source | Link | Licence |
|---|---|---|
| MedlinePlus Web Service (XML API) | [docs](https://medlineplus.gov/about/developers/webservices/) · e.g. `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=pcos` | NLM summaries are public domain. Don't copy the A.D.A.M. encyclopedia pages. Limit: 85 requests/min |
| WHO IRIS guidelines | https://iris.who.int/ | CC BY-NC-SA 3.0 IGO (non-commercial) |
| NHS condition pages | https://www.nhs.uk/conditions/ | Open Government Licence; the content API needs registration |
| ICMR guidelines | https://www.icmr.gov.in/guidelines | Indian government; cite and attribute ⚠ |
| FOGSI GCPR | https://www.fogsi.org/fogsi-gcpr/ ⚠ | Copyrighted; summarise and cite only |

## Suggested core for the build
- **PCOS screener:** Kerala PCOS data + XGBoost + SHAP, showing "why this risk" cards.
- **Cycle tracker:** keeps data on the device, shows uncertainty, flags irregular cycles.
- **Q&A assistant:** RAG over MedlinePlus, WHO and NHS content, with citations and Hinglish/Hindi support.
  - Gives triage advice, never a diagnosis.
  - Checked against small subsets of the Med-HALT and MedSafetyBench test sets.
- **Privacy:** no account, PIN lock or app disguise, data delete and export.

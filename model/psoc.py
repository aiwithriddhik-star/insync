
import numpy as np

from collections import defaultdict, Counter
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import LabelEncoder

from sklearn.mixture import GaussianMixture
from sklearn.svm import SVC, LinearSVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import PCA
from scipy.special import logsumexp
from joblib import Parallel, delayed
import matplotlib.pyplot as plt
import os
import seaborn as sns
import pandas as pd
from sklearn.model_selection import (
    train_test_split, StratifiedKFold,
    cross_val_score, validation_curve
)
from sklearn.feature_selection import RFE

#Loding data into the kernels 

file_path_with_infertility="dataset/PCOS_infertility.csv"
file_path_without_infertility="dataset/PCOS_data_without_infertility.xlsx"

# PCOS_inf = pd.read_csv(file_path_with_infertility)
df = pd.read_excel(file_path_without_infertility, sheet_name="Full_new").dropna(how='all')

df.columns = df.columns.str.strip()

# Drop irrelevant columns
for col in ['Unnamed: 44', 'Sl. No', "Patient File No."]:
    if col in df.columns:
        df.drop(columns=[col], inplace=True)

# Preprocessing

cat_cols = ['PCOS (Y/N)', "Blood Group", "Pregnant(Y/N)", "Weight gain(Y/N)", "hair growth(Y/N)", "Skin darkening (Y/N)", "Hair loss(Y/N)", "Pimples(Y/N)", "Fast food (Y/N)", "Reg.Exercise(Y/N)"]

for i in cat_cols:
    if i in df.columns:
        df[i] = df[i].astype("category")

df['II    beta-HCG(mIU/mL)'] = pd.to_numeric(df['II    beta-HCG(mIU/mL)'], errors='coerce')

df['BMI'] = df['Height(Cm)']/df['Weight (Kg)']
df['FSH/LH'] = df['FSH(mIU/mL)']/df['LH(mIU/mL)']
df['Waist:Hip Ratio'] = df['Waist(inch)']/df['Hip(inch)']
df['AMH(ng/mL)'] = pd.to_numeric(df['AMH(ng/mL)'], errors='coerce')

print(f'Shape: {df.shape}')
print(f'Columns: {list(df.columns)}')
print(f'columns datatypes: {df.dtypes}')
df.head(3)
orig_rows = len(df)

print(df.describe().T)

# df['PCOS (Y/N)'] = df['PCOS (Y/N)'].map({1:1, 0:0, 'Y':1, 'N':0}).fillna(df['PCOS (Y/N)'])

# # Top 20 Correlation Heatmap
# top20 = df.corr()['PCOS (Y/N)'].abs().sort_values(ascending=False).head(21).index.tolist()
fig, ax = plt.subplots(figsize=(12, 10), facecolor='white')
sns.heatmap(df.corr(), cmap='YlGnBu', annot=True, fmt='.2f',
            linewidths=0.3, linecolor='white', ax=ax, cbar_kws={'label':'Correlation'})
ax.set_title('Top 20 Feature Correlation Heatmap', fontsize=12, fontweight='bold')
plt.tight_layout()
plt.show()
# # Convert target to binary


# miss_before = df.isnull().sum().sum()

# for col in df.columns:
#     if col == 'PCOS (Y/N)':
#         continue
#     if col == 'Blood Group':
#         df[col] = df[col].fillna(df[col].mode()[0])
#         le = LabelEncoder()
#         df[col] = le.fit_transform(df[col].astype(str))
#     else:
#         df[col] = pd.to_numeric(df[col], errors='coerce')
#         df[col] = df[col].fillna(df[col].median())

# df.dropna(subset=['PCOS (Y/N)'], inplace=True)
# clean_rows = len(df)

# print(f'Missing values filled: {miss_before}')
# print(f'Rows: {orig_rows} → {clean_rows} (0 rows lost)')
# print(f'Target distribution:')
# print(df['PCOS (Y/N)'].value_counts())

# drop_cols = ['PCOS (Y/N)']
# if 'Patient File No.' in df.columns:
#     drop_cols.append('Patient File No.')

# X = df.drop(columns=drop_cols)
# y = df['PCOS (Y/N)'].astype(int)
# n_feat_before = X.shape[1]

# X_train, X_test, y_train, y_test = train_test_split(
#     X, y, test_size=0.2, stratify=y, random_state=SEED
# )

# print(f'Train: {len(X_train)} samples | Test: {len(X_test)} samples')
# print(f'Train class dist: {y_train.value_counts().to_dict()}')
# print(f'Test  class dist: {y_test.value_counts().to_dict()}')

# cls_before_0 = int(y_train.value_counts().get(0, 0))
# cls_before_1 = int(y_train.value_counts().get(1, 0))



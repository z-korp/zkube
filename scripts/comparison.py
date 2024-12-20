import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from scipy import stats

# Create DataFrame from the transaction data
data = {
    'tx_hash': [
        '0x7a261302ddd0d8a1a02580e7ac4e6f4d9270cd12a0fe4b55fd1ac45afe361f7',
        '0x5d0a2aa6d9fc9f82930807ec4ed908ad0c17502e34e7b1c486f2954811fdc89',
        '0x75a94b86b78db70b2f26b034f12fc5c40aadeacc2863f8ad63561e31e35fc4a',
        '0x5d23b9728a8850b695a9aa127566fb04ea6bd553d32b99cef303981f0b4c69a',
        '0x414d5ffce8fa525b3d66426b6519d268b548327e1482e13c1d3a46f14a6461d',
        '0xb576bd4ba17e79a5b83b1a3bdcdac922e2804282bbfbc00cbb236da0935fc5',
        '0x115b73e3aafd05fd77115acae80112bce0352b1c55ce8b8b889978a334937',
        '0x3de76c682b574dd35f0d63753628d64dc2debe8b8fd53ac7b923a30b6b2ee24',
        '0x74a5d5339df4f731e8430fbfd9d012259a2803bce39b1ecccf2126477bf47a0',
        '0x3f70adc4f6c4bd5c668ca826a9a515b94b4e92e5b99acba88d223e824249f2f',
        '0x5227aa3b7ab8d4a45694a20b80444fb5e9414727292f0745cae71bfb89a6b8a',
        '0x4450436dc7d2e8a1d4d600a1506a955a7170a18fd75edfcf9852d0d7e8c0740',
        '0x2917c8b086fbb49fe25d81c9bf0401d68159cec5726f98ea60d1c1f8a5cd34e'
    ],
    'fee_strk': [
        0.3887340263164098, 0.4457531271867301, 0.4773551794923131,
        0.5185682741792529, 0.5820006025234993, 0.4970344645117382,
        0.5153429092007363, 0.6880795321494751, 0.4219964666101333,
        0.49624359662976114, 0.4515437938628423, 0.4238905260494095,
        0.44661923932072417
    ],
    'steps': [
        176995, 199629, 211711, 226984, 250179, 230356,
        237585, 300632, 182511, 205134, 192217, 179566,
        188397
    ],
    'poseidon': [
        93, 113, 113, 113, 113, 133,
        133, 127, 117, 97, 117, 97,
        113
    ],
    'type': [
        'normal', 'normal', 'normal', 'normal', 'normal', 'normal',
        'normal', 'normal', 'normal', 'normal', 'normal', 'normal',
        'normal'
    ]
}

df = pd.DataFrame(data)

# Calculate correlations
correlations = {
    'steps_vs_fee': stats.pearsonr(df['steps'], df['fee_strk'])[0],
    'poseidon_vs_fee': stats.pearsonr(df['poseidon'], df['fee_strk'])[0],
    'steps_vs_poseidon': stats.pearsonr(df['steps'], df['poseidon'])[0]
}

# Create visualization
plt.figure(figsize=(15, 10))

# Steps vs Fee
plt.subplot(2, 2, 1)
sns.scatterplot(data=df, x='steps', y='fee_strk', hue='type')
plt.title(f'Steps vs Fee (correlation: {correlations["steps_vs_fee"]:.3f})')

# Poseidon vs Fee
plt.subplot(2, 2, 2)
sns.scatterplot(data=df, x='poseidon', y='fee_strk', hue='type')
plt.title(f'Poseidon vs Fee (correlation: {correlations["poseidon_vs_fee"]:.3f})')

# Steps vs Poseidon
plt.subplot(2, 2, 3)
sns.scatterplot(data=df, x='steps', y='poseidon', hue='type')
plt.title(f'Steps vs Poseidon (correlation: {correlations["steps_vs_poseidon"]:.3f})')

plt.tight_layout()

# Print statistical analysis
print("\nCorrelation Analysis:")
print(f"Steps vs Fee: {correlations['steps_vs_fee']:.3f}")
print(f"Poseidon vs Fee: {correlations['poseidon_vs_fee']:.3f}")
print(f"Steps vs Poseidon: {correlations['steps_vs_poseidon']:.3f}")

# Calculate average metrics by type
print("\nAverage Metrics by Type:")
print(df.groupby('type').agg({
    'steps': 'mean',
    'poseidon': 'mean',
    'fee_strk': 'mean'
}).round(2))

# Show any strong relationships
correlations_df = pd.DataFrame([correlations]).T
print("\nStrong Correlations (>0.7 or <-0.7):")
print(correlations_df[abs(correlations_df[0]) > 0.7])

plt.show()
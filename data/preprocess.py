# Data preprocessing utilities
import pandas as pd
import numpy as np

def load_data(filepath):
    """Load data from file"""
    return pd.read_csv(filepath)

def clean_data(df):
    """Clean and preprocess data"""
    df = df.dropna()
    return df

import os
import random

import joblib
from sklearn.ensemble import RandomForestRegressor

from .model_store import MODEL_PATH, MODEL_VERSION


def generate_synthetic_data(samples=500):
    X = []
    y = []
    for _ in range(samples):
        rain = random.random()
        aqi = random.uniform(20, 300)
        temp = random.uniform(5, 45)
        risk = min(1.0, 0.5 * rain + 0.3 * (aqi / 500) + 0.2 * max(0, (temp - 35) / 15))
        noise = random.uniform(-0.05, 0.05)
        risk = max(0, min(1, risk + noise))
        X.append([rain, aqi, temp])
        y.append(risk)
    return X, y


def train_and_save():
    X, y = generate_synthetic_data()
    model = RandomForestRegressor(n_estimators=120, random_state=42)
    model.fit(X, y)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    return MODEL_PATH


if __name__ == "__main__":
    path = train_and_save()
    print(f"Saved model {MODEL_VERSION} to {path}")

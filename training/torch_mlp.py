"""scikit-learn compatible PyTorch MLP. Trains on the Apple GPU (MPS) when available."""
import numpy as np
import torch
from sklearn.base import BaseEstimator, ClassifierMixin
from torch import nn


def pick_device(device="auto"):
    if device != "auto":
        return torch.device(device)
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


class TorchMLPClassifier(ClassifierMixin, BaseEstimator):
    def __init__(self, hidden=(32, 16), dropout=0.2, lr=1e-3, weight_decay=1e-3, epochs=150,
                 batch_size=64, batch_norm=False, device="auto", random_state=0):
        self.hidden = hidden
        self.dropout = dropout
        self.lr = lr
        self.weight_decay = weight_decay
        self.epochs = epochs
        self.batch_size = batch_size
        self.batch_norm = batch_norm
        self.device = device
        self.random_state = random_state

    def _build(self, n_in):
        layers, prev = [], n_in
        for h in self.hidden:
            layers.append(nn.Linear(prev, h))
            if self.batch_norm:
                layers.append(nn.BatchNorm1d(h))
            layers += [nn.ReLU(), nn.Dropout(self.dropout)]
            prev = h
        layers.append(nn.Linear(prev, 1))
        return nn.Sequential(*layers)

    def fit(self, X, y):
        self.classes_ = np.array([0, 1])
        dev = pick_device(self.device)
        torch.manual_seed(self.random_state)
        gen = torch.Generator().manual_seed(self.random_state)
        Xt = torch.as_tensor(np.asarray(X, dtype=np.float32), device=dev)
        yt = torch.as_tensor(np.asarray(y, dtype=np.float32), device=dev)
        self.net_ = self._build(Xt.shape[1]).to(dev)
        # Re-weight positives so the minority class (PCOS) is not ignored
        pos_weight = (1 - yt.mean()) / yt.mean().clamp(min=1e-6)
        loss_fn = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        opt = torch.optim.AdamW(self.net_.parameters(), lr=self.lr, weight_decay=self.weight_decay)
        n = Xt.shape[0]
        self.net_.train()
        for _ in range(self.epochs):
            perm = torch.randperm(n, generator=gen).to(dev)
            for i in range(0, n, self.batch_size):
                idx = perm[i:i + self.batch_size]
                if len(idx) < 2:  # BatchNorm needs >1 sample
                    continue
                opt.zero_grad()
                loss_fn(self.net_(Xt[idx]).squeeze(1), yt[idx]).backward()
                opt.step()
        self.device_ = dev
        return self

    def predict_proba(self, X):
        self.net_.eval()
        with torch.no_grad():
            Xt = torch.as_tensor(np.asarray(X, dtype=np.float32), device=self.device_)
            p = torch.sigmoid(self.net_(Xt).squeeze(1)).cpu().numpy()
        return np.column_stack([1 - p, p])

    def predict(self, X):
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)

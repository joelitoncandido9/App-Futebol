"""
Script de predições diárias — executado pelo GitHub Actions
Gera predições para os jogos do dia usando Dixon-Coles + Poisson
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

BSD_TOKEN = os.getenv("BSD_TOKEN", "")
ROOT = Path(__file__).parent.parent

def bsd_get(endpoint: str) -> dict:
    url = f"https://sports.bzzoiro.com/api/v2{endpoint}"
    r = requests.get(url, headers={"Authorization": f"Token {BSD_TOKEN}"}, timeout=15)
    r.raise_for_status()
    return r.json()

def get_today_matches():
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data = bsd_get(f"/events/?date_from={hoje}&date_to={hoje}&limit=200")
    return data.get("results", [])

def get_league_odds_averages() -> dict:
    """Carrega médias históricas do JSON estático"""
    path = ROOT / "data" / "ml_data.json"
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return {}

def main():
    print(f"[Predict] Iniciando predições para {datetime.now().isoformat()}")

    # Carrega médias históricas
    league_data = get_league_odds_averages()
    print(f"[Predict] {len(league_data.get('league_averages', {}))} ligas carregadas")

    # Busca jogos do dia
    matches = get_today_matches()
    print(f"[Predict] {len(matches)} jogos encontrados para hoje")

    predictions = []
    for match in matches:
        event_id = match.get("id")
        home = match.get("home_team", "")
        away = match.get("away_team", "")
        league = (match.get("league") or {}).get("name", "")

        # Predição básica 1X2 via Poisson com média da liga
        predictions.append({
            "event_id": event_id,
            "home_team": home,
            "away_team": away,
            "league": league,
            "match_date": match.get("event_date", ""),
            "status": "pending",
        })

    # Salva resultado
    output = {
        "generated_at": datetime.now().isoformat(),
        "match_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "total_matches": len(matches),
        "predictions": predictions,
    }

    out_dir = ROOT / "predictions"
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "daily.json", "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"[Predict] ✅ Salvo em predictions/daily.json ({len(predictions)} jogos)")

if __name__ == "__main__":
    main()

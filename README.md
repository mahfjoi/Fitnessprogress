# Fitnessprogress

Schlanke Trainings-Web-App: Trainingsplan erstellen und Fortschritt tracken – sonst nichts.

## Funktionen

- **Plan**: mehrere Trainingstage (z. B. Push/Pull/Beine), je Übung Sätze, Ziel-Wiederholungen und Pausenzeit
- **Training**: zeigt pro Übung die Gewichte und Wiederholungen vom letzten Mal und füllt die Sätze damit vor; Satz abhaken startet den Pausentimer (Vibration + Ton)
- **Fortschritt**: Diagramm pro Übung (max. Gewicht, geschätztes 1RM, Volumen, max. Wdh.) und kompletter Verlauf
- **Daten**: alles lokal im Browser (localStorage), Backup als JSON exportieren/importieren

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
```

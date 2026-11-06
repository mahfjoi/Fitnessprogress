# Fitnessprogress

Schlanke Trainings-Web-App: Trainingsplan erstellen und Fortschritt tracken – sonst nichts.

## Funktionen

- **Plan**: mehrere Trainingstage, Übungen aus einem Katalog (filterbar nach Körperregion, mit Suche) oder eigene; je Übung Sätze, Ziel-Wiederholungen und Pausenzeit
- **Training**: zeigt pro Übung die Gewichte und Wiederholungen vom letzten Mal und füllt die Sätze damit vor; Satz abhaken startet den Pausentimer (Vibration + Ton)
- **Fortschritt**: Diagramm pro Übung (max. Gewicht, geschätztes 1RM, Volumen, max. Wdh.) und kompletter Verlauf
- **Daten**: alles lokal im Browser (localStorage), Backup als JSON exportieren/importieren

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
```

## Auf dem Handy nutzen

Die App wird bei jedem Push auf `master` automatisch auf GitHub Pages veröffentlicht:
**https://mahfjoi.github.io/Fitnessprogress/**

- **iPhone (Safari):** Teilen → „Zum Home-Bildschirm“
- **Android (Chrome):** Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“

Danach startet sie wie eine normale App und funktioniert auch offline.

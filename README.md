# Leandro AI — lokale versie met open-source model

Deze map bevat een werkende webchat die via een kleine lokale backend berichten doorstuurt naar Ollama. Standaard gebruikt ze `qwen3:8b`. De eerste modelstart kan traag zijn doordat Ollama het model moet laden.

## Eenmalig installeren

1. Installeer Ollama vanaf https://ollama.com/download.
2. Open een terminal en voer uit:

   ```bash
   ollama run qwen3:8b
   ```

3. Test of het model antwoordt. Typ daarna `/bye` om de interactieve modelsessie af te sluiten. Ollama draait normaal op de achtergrond. Als de webchat later meldt dat Ollama niet bereikbaar is, start Ollama opnieuw vanuit de Ollama-app; op systemen waar de service niet automatisch start, kun je in een aparte terminal `ollama serve` gebruiken.
4. Installeer Node.js 18 of nieuwer (een recente LTS-versie is aanbevolen) vanaf https://nodejs.org/.

## Leandro AI starten

1. Pak het zipbestand uit.
2. Open een terminal in de uitgepakte map `leandro-ai-local` (de map waar `server.js` staat).
3. Voer uit:

   ```bash
   node server.js
   ```

4. Open **http://localhost:3000** in je browser.
5. Stel je vraag. De website controleert bovenaan of Ollama en het model bereikbaar zijn.
6. Om Leandro AI te stoppen: ga terug naar de terminal en druk op `Ctrl+C`.

Je hoeft geen `npm install` uit te voeren: de backend gebruikt alleen ingebouwde Node.js-modules.

## Als je een foutmelding ziet

- **Ollama niet gestart:** start de Ollama-app opnieuw.
- **Model ontbreekt:** voer `ollama pull qwen3:8b` uit en probeer opnieuw.
- **Model reageert traag:** wacht even tot het model geladen is; sluit zware programma's of kies een kleiner model als je computer weinig geheugen heeft.
- **`node` wordt niet herkend:** installeer Node.js en open daarna een nieuwe terminal.
- **Poort 3000 bezet:** start met `PORT=3001 node server.js` (macOS/Linux) of `set PORT=3001&& node server.js` (Windows) en open `http://localhost:3001`.

## Privacy en online zetten

Deze configuratie bindt de webserver aan `127.0.0.1`, zodat die alleen op je eigen computer bereikbaar is. De webapp gebruikt `/api/chat` van deze lokale backend; de backend praat met Ollama op de lokale computer. Zet dit niet rechtstreeks open naar het internet. Om publiek online te gaan, moet de backend op een server draaien waar het model bereikbaar is, met authenticatie, limieten en HTTPS.

## Model wijzigen

Standaard staat `OLLAMA_MODEL` op `qwen3:8b`. Installeer eerst het gewenste model en pas deze variabele aan als je een andere modelnaam gebruikt.

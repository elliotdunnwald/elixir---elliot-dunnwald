# ELIXR Equipment Database

This directory contains the brewing equipment database used throughout the app.

## Files

- **`brewing-equipment.json`** - Main equipment database (editable)
- **`database.ts`** - TypeScript module that imports and exports the JSON data
- **`roasters.json`** - Roaster database (coming soon)

## Editing the Equipment Database

The `brewing-equipment.json` file contains all brewing equipment available in ELIXR. You can edit this file directly to add, remove, or modify equipment.

### Structure

```json
{
  "brewers": [
    {
      "name": "V60 02",
      "brand": "HARIO",
      "type": "DRIPPER",
      "category": "pourover"
    }
  ],
  "grinders": [],
  "accessories": []
}
```

### Fields

- **`name`**: Product model name (e.g., "V60 02", "CLASSIC PRO")
- **`brand`**: Manufacturer/brand name (e.g., "HARIO", "GAGGIA")
- **`type`**: Equipment type - must be one of:
  - `DRIPPER` - Pour over brewers
  - `IMMERSION` - Immersion brewers (Aeropress, French Press)
  - `ESPRESSO` - Espresso machines
  - `AUTOMATIC` - Automatic drip coffee makers
  - `POD` - Pod/capsule machines
  - `STOVETOP` - Moka pots
  - `SIPHON` - Siphon/vacuum brewers
  - `COLD BREW` - Cold brew systems
- **`category`**: Grouping category for filtering (lowercase version of type)

### Adding New Equipment

1. Open `brewing-equipment.json`
2. Find the `"brewers"` array
3. Add a new entry following the structure above
4. Save the file
5. Restart the dev server (`npm run dev`)

**Example - Adding a new espresso machine:**

```json
{
  "name": "BARISTA EXPRESS IMPRESS",
  "brand": "BREVILLE",
  "type": "ESPRESSO",
  "category": "espresso"
}
```

### Adding Grinders (Future)

When ready to add grinders, populate the `"grinders"` array:

```json
{
  "brewers": [...],
  "grinders": [
    {
      "name": "COMANDANTE C40",
      "brand": "COMANDANTE",
      "type": "HAND_GRINDER",
      "category": "manual"
    },
    {
      "name": "NICHE ZERO",
      "brand": "NICHE",
      "type": "ELECTRIC_GRINDER",
      "category": "electric"
    }
  ],
  "accessories": []
}
```

### Best Practices

- Use **UPPERCASE** for names and brands to maintain consistency
- Remove duplicates (e.g., "ORIGAMI ORIGAMI DRIPPER" → "ORIGAMI DRIPPER")
- Verify products exist before adding them
- Group similar items together (keep all HARIO products near each other)
- Use exact product names from manufacturer websites

### Testing Changes

After editing the JSON:

1. Save the file
2. Restart the dev server
3. Test the gear selection during profile setup
4. Search for your newly added equipment

## Categories Explained

### Pourover (`pourover`)
Manual pour over brewers like V60, Kalita Wave, Chemex, etc.

### Immersion (`immersion`)
Brewers where coffee steeps in water (Aeropress, French Press, Clever)

### Espresso (`espresso`)
All espresso machines (manual, semi-automatic, automatic)

### Automatic (`automatic`)
Drip coffee makers (Moccamaster, Breville Precision, etc.)

### Pod (`pod`)
Capsule/pod machines (Nespresso, etc.)

### Stovetop (`stovetop`)
Moka pots and stovetop espresso makers

### Siphon (`siphon`)
Vacuum/siphon brewers

### Cold Brew (`cold-brew`)
Cold brew systems and equipment

---

For questions or issues, check the main ELIXR documentation or create an issue on GitHub.

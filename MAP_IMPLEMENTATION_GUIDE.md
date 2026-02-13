# Apple Maps Integration Guide

## ✅ What's Been Implemented

### 1. **Map View** (`/map` route)
- Full-screen map showing your current location
- Displays brew locations (ready for future database updates)
- Stats panel showing total brews and locations
- Built with free OpenStreetMap (no API keys needed!)

### 2. **Location Picker Component**
- Modal to select brew location
- "Use Current Location" button
- Tap anywhere on map to select location
- Reverse geocoding to show address
- Ready to integrate into BrewLogModal

### 3. **Navigation**
- Added MAP tab in bottom navigation (mobile)
- Map icon (📍) in nav bar

## 🔧 iOS Setup Required

### Add Location Permissions to Info.plist

When you open your project in Xcode (`npx cap open ios`), you need to add these privacy descriptions:

1. Open `ios/App/App/Info.plist`
2. Add these keys:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>ELIXR uses your location to tag where you brewed coffee and discover nearby specialty cafes.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>ELIXR uses your location to tag where you brewed coffee and discover nearby specialty cafes.</string>
```

**Or** right-click Info.plist in Xcode and add:
- **Key**: Privacy - Location When In Use Usage Description
- **Value**: "ELIXR uses your location to tag where you brewed coffee and discover nearby specialty cafes."

## 📱 Current Features

### Map View (`/map`)
- ✅ Shows your current location
- ✅ Interactive map (zoom, pan, tap)
- ✅ Stats panel with brew counts
- 🚧 Brew location markers (needs database updates)

### Location Picker
- ✅ Get current GPS location
- ✅ Select location by tapping map
- ✅ Reverse geocode to city/country
- ✅ Confirm and save location
- 🚧 Integration into BrewLogModal

## 🔮 Next Steps (Optional)

### To Store Brew Locations in Database

Add these columns to `brew_activities` table:

```sql
ALTER TABLE brew_activities
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;
```

### To Integrate Location Picker in BrewLogModal

In `BrewLogModal.tsx`:

```typescript
import LocationPicker from './LocationPicker';

// Add state
const [showLocationPicker, setShowLocationPicker] = useState(false);
const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

// Add handler
const handleLocationSelect = (lat: number, lng: number, address?: string) => {
  setSelectedLocation({ lat, lng });
  setFormData({ ...formData, locationName: address || '' });
};

// Add button in the form
<button onClick={() => setShowLocationPicker(true)}>
  <MapPin /> Add Location
</button>

// Add modal
<LocationPicker
  isOpen={showLocationPicker}
  onClose={() => setShowLocationPicker(false)}
  onSelectLocation={handleLocationSelect}
/>
```

### To Show Brews on Map

Update `MapView.tsx` to read lat/lng from activities and display markers:

```typescript
{activities.map(activity => (
  activity.latitude && activity.longitude && (
    <Marker
      key={activity.id}
      position={[activity.latitude, activity.longitude]}
    >
      <Popup>
        <div>
          <p className="font-black">{activity.title}</p>
          <p>{activity.roaster}</p>
        </div>
      </Popup>
    </Marker>
  )
))}
```

## 💰 Cost Breakdown

**OpenStreetMap & Leaflet**: FREE forever ✅
- Unlimited map views
- No API key needed
- Open source
- Community maintained

**Capacitor Geolocation**: FREE ✅
- Uses native iOS location services
- No usage limits

**Alternative (Apple MapKit JS)**:
- 250,000 map views/day FREE
- 25,000 service calls/day FREE
- Could upgrade later if needed

## 🎯 What Users Can Do Now

1. **View Map**: Tap MAP in bottom nav
2. **See Current Location**: Blue marker shows "You are here"
3. **Explore**: Pan and zoom around the map
4. **Stats**: See total brews and locations

## 📝 Testing Checklist

- [ ] Add location permissions to Info.plist in Xcode
- [ ] Build and run on iOS device or simulator
- [ ] Tap "MAP" in bottom navigation
- [ ] Allow location access when prompted
- [ ] Verify your location appears on map
- [ ] Pan and zoom the map
- [ ] Check stats panel displays correctly

## 🐛 Troubleshooting

**Map doesn't load:**
- Check internet connection (needs to download tiles)
- Check browser console for errors

**Location permission denied:**
- Go to Settings > ELIXR > Location
- Select "While Using the App"

**Markers don't appear:**
- Database doesn't have lat/lng yet
- Need to run migration and update BrewLogModal

## 🚀 Future Enhancements

- [ ] Store brew locations in database
- [ ] Add location picker to brew logging
- [ ] Cluster markers when zoomed out
- [ ] Filter brews by location
- [ ] Discover nearby cafes
- [ ] Show roaster locations
- [ ] Heat map of brew density
- [ ] Location-based brew recommendations

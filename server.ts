import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

interface VisitorLocation {
  id: string;
  visitorId?: string;
  ref: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  state: string;
  locality: string;
  temp: string;
  condition: string;
  timestamp: string;
  userAgent: string;
}

const DATA_FILE = path.join(process.cwd(), "locations.json");

// Helper to read locations
async function readLocations(): Promise<VisitorLocation[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Helper to write locations
async function writeLocations(locations: VisitorLocation[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(locations, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Report Location
  app.post("/api/report-location", async (req, res) => {
    try {
      const { visitorId, ref, lat, lon, city, country, state, locality, temp, condition } = req.body;
      
      const numLat = typeof lat === "number" ? lat : parseFloat(lat);
      const numLon = typeof lon === "number" ? lon : parseFloat(lon);

      if (isNaN(numLat) || isNaN(numLon)) {
        return res.status(400).json({ error: "Latitude and longitude must be valid numbers" });
      }

      const locations = await readLocations();
      
      // Look for an existing record with the same visitorId or name
      let existingIndex = -1;
      if (visitorId) {
        existingIndex = locations.findIndex(l => l.visitorId === visitorId);
      } else if (ref && ref !== "Direct Visitor" && ref !== "Direct Link") {
        existingIndex = locations.findIndex(l => l.ref === ref);
      }

      if (existingIndex !== -1) {
        // Update existing record in-place and bump timestamp
        locations[existingIndex] = {
          ...locations[existingIndex],
          lat: numLat,
          lon: numLon,
          city: city || "Unknown Location",
          country: country || "",
          state: state || "",
          locality: locality || "",
          temp: temp || "--",
          condition: condition || "--",
          timestamp: new Date().toISOString(),
          userAgent: req.headers["user-agent"] || "Unknown"
        };
        
        // Move to start of list to show it was recently updated
        const updatedItem = locations.splice(existingIndex, 1)[0];
        locations.unshift(updatedItem);
        
        await writeLocations(locations);
        res.status(200).json({ success: true, location: updatedItem });
      } else {
        // Create new record
        const newLoc: VisitorLocation = {
          id: Math.random().toString(36).substring(2, 11),
          visitorId: visitorId || `v_anon_${Math.random().toString(36).substring(2, 11)}`,
          ref: ref || "Direct Link",
          lat: numLat,
          lon: numLon,
          city: city || "Unknown Location",
          country: country || "",
          state: state || "",
          locality: locality || "",
          temp: temp || "--",
          condition: condition || "--",
          timestamp: new Date().toISOString(),
          userAgent: req.headers["user-agent"] || "Unknown"
        };

        locations.unshift(newLoc);
        await writeLocations(locations);
        res.status(201).json({ success: true, location: newLoc });
      }
    } catch (err: any) {
      console.error("Error reporting location:", err);
      res.status(500).json({ error: err.message || "Failed to save location" });
    }
  });

  // API Route: Get Locations
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await readLocations();
      res.json(locations);
    } catch (err: any) {
      console.error("Error fetching locations:", err);
      res.status(500).json({ error: err.message || "Failed to read locations" });
    }
  });

  // API Route: Delete Locations
  app.delete("/api/locations", async (req, res) => {
    try {
      await writeLocations([]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error clearing locations:", err);
      res.status(500).json({ error: err.message || "Failed to clear locations" });
    }
  });

  // API Route: Clear specific location
  app.delete("/api/locations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const locations = await readLocations();
      const filtered = locations.filter(l => l.id !== id);
      await writeLocations(filtered);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting location:", err);
      res.status(500).json({ error: err.message || "Failed to delete location" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/locations.json', '**/locations.json**', '**/dist/**']
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

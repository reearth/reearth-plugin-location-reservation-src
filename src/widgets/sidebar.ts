import * as turf from "@turf/turf";

import html from "../../dist/web/sidebar/index.html?raw";
import type { MouseEvent } from "../apiType";
import type { actHandles } from "../type";

type Area = {
  id: string;
  layerId: string;
  radius: number;
  lng: number;
  lat: number;
};

// Preload polygon
const preloadPolygon = () => {
  const point = turf.point([0, 0], {
    stroke: "#00FF38",
    "stroke-width": 10,
    "stroke-opacity": 0,
    fill: "#00FF38",
    "fill-opacity": 0,
  });
  const buffered = turf.buffer(point, 0.1, { units: "kilometers" });
  const collection = turf.featureCollection([buffered]);
  (globalThis as any).reearth.layers.add({
    extensionId: "resource",
    isVisible: true,
    title: `Areas-Preload`,
    property: {
      default: {
        type: "geojson",
        url: collection,
      },
    },
  });
};
preloadPolygon();

// Add Area
let isAddingArea = false;
const areas: Area[] = [];

const style = {
  stroke: "#00FF38",
  "stroke-width": 10,
  "stroke-opacity": 1,
  fill: "#00FF38",
  "fill-opacity": 0.5,
};

const addArea = (lng: number, lat: number) => {
  const id = (areas.length + 1).toString();
  const radius = 50;

  const point = turf.point([lng, lat], style);
  const buffered = turf.buffer(point, radius * 0.001, { units: "kilometers" });
  const collection = turf.featureCollection([buffered]);

  const layerId = (globalThis as any).reearth.layers.add({
    extensionId: "resource",
    isVisible: true,
    title: `Areas-${id}`,
    property: {
      default: {
        type: "geojson",
        url: collection,
      },
    },
  });

  const area = {
    id,
    layerId,
    radius,
    lng,
    lat,
  };

  areas.push(area);

  (globalThis as any).reearth.ui.postMessage(
    JSON.stringify({ act: "addArea", payload: area })
  );
};

const updateArea = ({ id, radius }: { id: string; radius: number }) => {
  if (!radius) return;
  const area = areas.find((a) => a.id === id);
  if (!area) return;

  const point = turf.point([area.lng, area.lat], style);
  const buffered = turf.buffer(point, radius * 0.001, { units: "kilometers" });
  const collection = turf.featureCollection([buffered]);
  (globalThis as any).reearth.layers.overrideProperty(area.layerId, {
    default: {
      url: collection,
      type: "geojson",
    },
  });
};

const removeArea = (id: string) => {
  (globalThis as any).reearth.layers.hide(id);
};

const handles: actHandles = {
  setSidebarShown: (shown: boolean) => {
    if (shown) {
      (globalThis as any).reearth.ui.resize(350, 100, true);
    } else {
      (globalThis as any).reearth.ui.resize(40, 40, false);
    }
  },
  setAddingArea: (adding: boolean) => {
    isAddingArea = adding;
  },
  updateArea,
  removeArea,
};

(globalThis as any).reearth.ui.show(html, {
  width: 350,
  height: 100,
  extended: true,
});

(globalThis as any).reearth.on("message", (msg: string) => {
  const data = JSON.parse(msg);
  if (data?.act) {
    handles[data.act]?.(data.payload);
  }
});

(globalThis as any).reearth.on("click", (msg: MouseEvent) => {
  // console.log(msg);
  if (!isAddingArea) return;
  if (msg.lng !== undefined && msg.lat !== undefined) {
    addArea(msg.lng, msg.lat);
    isAddingArea = false;
  }
});
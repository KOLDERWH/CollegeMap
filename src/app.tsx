import React, { useEffect, useRef } from 'react';
import { Map, Popup } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './app.css';
import { defaultStyle } from '../public/style/default';

export default function App() {
  const isMapInit = useRef(false);

  useEffect(() => {
    if (isMapInit.current) return;
    const map = new Map({
      container: 'map',
      center: [114, 22.6],
      zoom: 18,
      style: defaultStyle,
      accessToken:
        'pk.eyJ1IjoidnVicGF6cXdrZCIsImEiOiJjbWQwYXV5OGcwZ3ZsMmtvaG9sNHo0bTdqIn0.3H4KN1N6ujOusSinr2OuDw',
      antialias: false,
      projection: 'mercator',
    });

    map.on('load', async () => {
      const poiList: Array<any> = [];

      fetch('/data/college.json')
        .then((res) => res.json())
        .then((json: Array<any>) => {
          json.forEach((item) => {
            if (!item.cartographic) return;
            const info = {
              name: item.name,
              address: item.address,
              cityname: item.cityname,
              cartoGraphic: item.cartographic,
              offical: item.offical,
              class: item.class,
              eamil: item.eamil,
              phone: item.phone,
              guide: item.guide,
            };
            poiList.push(info);
          });
        })
        .then(() => {
          //resource
          const geojson = {
            type: 'FeatureCollection',
            features: poiList.flatMap((poi) => {
              let icon = 'school-icon';
              let iconSize = 0.3;
              let fontSize = 8;
              let fontColor = '#1db0eb';
              if (poi.class === 0) {
                icon = 'school-icon-double-firstClass';
                iconSize = 0.6;
                fontSize = 13;
                fontColor = '#ff00ff';
              } else if (poi.class === 1) {
                icon = 'school-icon-double-firstClass';
                iconSize = 0.5;
                fontSize = 12;
                fontColor = '#df5384';
              } else if (poi.class === 2) {
                icon = 'school-icon-double-firstClass';
                iconSize = 0.45;
                fontSize = 11;
                fontColor = '#cccc00';
              } else if (poi.class === 3) {
                iconSize = 0.4;
                fontSize = 10;
                fontColor = '#ffffff';
              }

              const item = {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [
                    poi.cartoGraphic.longitude,
                    poi.cartoGraphic.latitude,
                  ],
                },
                properties: {
                  name: poi.name,
                  address: poi.address,
                  cityname: poi.cityname,
                  offical: poi.offical,
                  eamil: poi.eamil,
                  phone: poi.phone,
                  guide: poi.guide,
                  icon,
                  iconSize,
                  fontSize,
                  fontColor,
                },
              };

              return item;
            }),
          };

          map.addSource('poiSource', {
            type: 'geojson',
            data: geojson,
          });
        })
        .then(async () => {
          map.loadImage('/icon/school_pinlet-2-medium.png', (error, image) => {
            if (!error && !map.hasImage('school-icon')) {
              map.addImage('school-icon', image);
            }
          });
          map.loadImage(
            '/icon/school_cn_jp_pinlet-2-medium.png',
            (error, image) => {
              if (!error && !map.hasImage('school-icon-double-firstClass')) {
                map.addImage('school-icon-double-firstClass', image);
              }
            }
          );

          console.log('school-icon', map.hasImage('school-icon'));

          // 1. 添加图标层
          map.addLayer({
            id: 'iconLayer',
            type: 'symbol',
            source: 'poiSource',
            layout: {
              'icon-image': ['get', 'icon'],
              'icon-size': ['get', 'iconSize'],
              'symbol-sort-key': ['to-number', ['get', 'class']],
            },
          });

          // 2. 添加文本图层
          map.addLayer({
            id: 'nameLayer',
            type: 'symbol',
            source: 'poiSource',
            layout: {
              'text-field': ['get', 'name'], // 获取名称
              'text-size': ['get', 'fontSize'],
              'text-anchor': 'top',
              'text-offset': [0, 1.5],
              'symbol-sort-key': ['to-number', ['get', 'class']],
            },
            paint: {
              'text-color': ['get', 'fontColor'],
              'text-halo-color': '#000000',
              'text-halo-width': 2,
            },
          });

          function clickEnvent(data) {
            const feature = data.features![0];
            const properties = feature.properties;
            const poiCoordinates = feature.geometry.coordinates;

            new Popup({ offset: [0, -20] })
              .setLngLat(poiCoordinates)
              .setHTML(
                `
  <div class="popup-content">
    <a href="${properties.offical}" target="_blank">
      ${properties.name}
    </a>
    <div><span>📧 邮箱：</span>${properties.eamil || '-'}</div>
    <div><span>📞 电话：</span>${properties.phone || '-'}</div>
    <div><span>📍 地址：</span>${properties.address || '-'}</div>
    <div><span>📝 指引：</span>${properties.guide || '-'}</div>
  </div>
`
              )

              .addTo(map);

            map.flyTo({
              center: poiCoordinates,
              zoom: 12,
              speed: 1.2,
              curve: 1.42,
            });
          }

          map.on('click', 'nameLayer', (data) => {
            clickEnvent(data);
          });
          map.on('click', 'iconLayer', (data) => {
            clickEnvent(data);
          });
        })
        .then((json) => {
          let minLon = Infinity;
          let maxLon = -Infinity;
          let minLat = Infinity;
          let maxLat = -Infinity;

          // 遍历 poiList 获取经纬度的最大最小值
          poiList.forEach((poi) => {
            if (!poi.cartoGraphic) return;
            const { latitude, longitude } = poi.cartoGraphic;
            minLon = Math.min(minLon, longitude);
            maxLon = Math.max(maxLon, longitude);
            minLat = Math.min(minLat, latitude);
            maxLat = Math.max(maxLat, latitude);
          });

          // 创建一个包含所有点的 bounding box
          const bounds = [
            [minLon, minLat], // 西南角
            [maxLon, maxLat], // 东北角
          ];

          map.fitBounds(bounds, {
            padding: 5,
            maxZoom: 17,
            duration: 500,
          });
        })

        .catch((err) => console.error('Error fetching GeoJSON data:', err));
    });

    isMapInit.current = true;
  }, []);

  return <div id="map"></div>;
}

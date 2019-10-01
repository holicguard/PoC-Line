import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { map } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { loadModules, loadScript, ILoadScriptOptions } from 'esri-loader';
import { HttpHeaders, HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import axios from 'axios';
const option: ILoadScriptOptions = {
  url: 'https://js.arcgis.com/3.29/',
  css: 'https://js.arcgis.com/3.29/esri/css/esri.css'
};
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  displayedColumns: string[] = ['Location', 'Message', 'btn', 'fix'];
  gpLayer: any;
  map: any;
  intersec: any[];
  constructor(private db: AngularFireDatabase, private http: HttpClient) {
    this.fbConn = this.db.list('/user');
  }
  @ViewChild('eleMap', { static: false }) eleMap: ElementRef;
  @ViewChild('userI', { static: false }) userI: ElementRef;
  @ViewChild('locationI', { static: false }) locationI: ElementRef;
  user = new FormControl();
  location = new FormControl();
  fbConn: AngularFireList<any>;
  userDb: any[];
  ngOnInit() {
    // tslint:disable-next-line: no-string-literal
    window['zzz'] = this;
    this.fbConn.snapshotChanges().pipe(map(actions => {
      return actions.map(action => ({ key: action.key, value: action.payload.val() }));
    })).subscribe(items => {
      this.userDb = [];
      this.userDb = items;
      if (this.map) {
        this.map.removeLayer(this.map.getLayer('point'));
      }
      this.initMap();
    });

  }
  // call firebase!
  btnClick() {
    const now = new Date();
    const pushDate = now.toLocaleString('TH');
    this.db.object('/trigger/time').set(pushDate);
  }

  getImage(imageId) {
    const target = 'http://localhost:3000/lineImageRequest';
    const httpOptions = {
      params: new HttpParams().set('imageid', imageId)
    };
    this.http.get(target, httpOptions).subscribe(res => {
    });
  }

  lineNoti(useridTarget) {
    const target = 'http://localhost:3000/lineNoti';
    const httpOptions = {
      params: new HttpParams().set('userid', useridTarget.toString())

    };
    this.http.post(target, null, httpOptions).subscribe(res => {
    });
  }

  async initMap() {
    await loadScript(option);
    const [Map] = await loadModules(['esri/map']);
    const [Point] = await loadModules(['esri/geometry/Point']);
    const [GraphicsLayer] = await loadModules(['esri/layers/GraphicsLayer']);
    const [Graphic] = await loadModules(['esri/graphic']);
    const [SimpleMarkerSymbol] = await loadModules(['esri/symbols/SimpleLineSymbol']);
    const [PictureMarkerSymbol] = await loadModules(['esri/symbols/PictureMarkerSymbol']);
    const [SpatialReference] = await loadModules(['esri/SpatialReference']);
    const [InfoTemplate] = await loadModules(['esri/InfoTemplate']);
    if (this.map === undefined) {
      this.map = new Map(this.eleMap.nativeElement, {
        basemap: 'topo',
        zoom: 8,
        center: [100, 13]
      });
    }
    const simpleMarkerSymbol = new SimpleMarkerSymbol({
      color: [43, 63, 262],
      size: 10,
      type: 'esriSMS',
      style: 'esriSMSCircle',
      outline: {
        color: [43, 63, 262],
        width: 3,
        type: 'esriSLS',
        style: 'esriSLSSolid'
      }
    });

    const pin = new PictureMarkerSymbol({
      url: 'https://cdn0.iconfinder.com/data/icons/maps-and-navigation-1-1/52/43-512.png',
      height: 20,
      width: 20,
    });
    const layer = new GraphicsLayer({ id: 'point' });
    this.userDb.forEach((item, index) => {
      this.getImage(item.value.image);
      const imageShow = new InfoTemplate();
      imageShow.setTitle(item.key);
      // tslint:disable-next-line: max-line-length
      imageShow.setContent('<img src=http://localhost:3000/lineImageRequest?imageid=' + item.value.image + ' alt="View" style="width:70%;height:70%"> \n  Problem:' + item.value.message);
      const split = item.value.location.split(',');
      const point = new Point(parseFloat(split[0]), parseFloat(split[1]), new SpatialReference({ wkid: 4326 }));
      const prepare = new Graphic(point, pin);
      prepare.setInfoTemplate(imageShow);
      layer.add(prepare);
      layer.IsAlwaysOnTop = true;
    });
    this.map.addLayer(layer);
  }

  goToC(point) {
    point = point.split(',');
    this.map.centerAt([point[0], point[1]]);
  }

  firebaseChangeStatus(id) {
    this.db.object('/user/' + id + '/mode').set(0);
  }

  fetchUserid() {
    let userid = [];
    if (this.intersec.length > 0) {
      this.intersec.forEach(element => {
        const x = element.item.x.toString();
        const y = element.item.y.toString();
        const locationfind = x + ',' + y;
        userid = this.userDb.filter((finder) => finder.value.location === locationfind);
        userid.forEach(fltered => {
          this.lineNoti(fltered.key);
        });
      });
    }
  }

  async polygonExample() {
    await loadScript(option);
    const [Color] = await loadModules(['esri/Color']);
    const [Polygon] = await loadModules(['esri/geometry/Polygon']);
    const [GraphicsLayer] = await loadModules(['esri/layers/GraphicsLayer']);
    const [Graphic] = await loadModules(['esri/graphic']);
    const [SimpleFillSymbol] = await loadModules(['esri/symbols/SimpleFillSymbol']);
    const [SimpleLineSymbol] = await loadModules(['esri/symbols/SimpleLineSymbol']);
    const sym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
      new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
        new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25])
    );
    const polygonJson = {
      "rings": [[[100, 13], [100, 14], [101, 14], [101, 13]]], "spatialReference": { "wkid": 4326 }
    };
    const x = new Polygon(polygonJson);
    const layer = new GraphicsLayer({ id: 'poly' });
    layer.add(new Graphic(x, sym));
    this.map.addLayer(layer);
  }

  async compareGeo() {
    this.intersec = [];
    await loadScript(option);
    const [geometryEngine] = await loadModules(['esri/geometry/geometryEngine']);
    if (this.map.getLayer('freehand') !== undefined) {
      this.map.getLayer('point').graphics.forEach(async (item, index) => {
        const inThere = await geometryEngine.intersects(this.map.getLayer('freehand').graphics[0].geometry, item.geometry);
        if (inThere) {
          this.intersec.push({ no: index + 1, item: item.geometry, intersect: inThere });
        }
      });
      console.log(this.intersec);
    } else if (this.map.getLayer('poly') !== undefined) {
      this.map.getLayer('point').graphics.forEach(async (item, index) => {
        const inThere = await geometryEngine.intersects(this.map.getLayer('poly').graphics[0].geometry, item.geometry);
        if (inThere) {
          this.intersec.push({ no: index + 1, item: item.geometry, intersect: inThere });
        }
      });
      console.log(this.intersec);
    } else {
      console.log('no polygon on map');
    }
  }

  async polygonDraw() {
    await loadScript(option);
    const [Color] = await loadModules(['esri/Color']);
    const [Polygon] = await loadModules(['esri/geometry/Polygon']);
    const [GraphicsLayer] = await loadModules(['esri/layers/GraphicsLayer']);
    const [Graphic] = await loadModules(['esri/graphic']);
    const [Draw] = await loadModules(['esri/toolbars/draw']);
    const [SimpleFillSymbol] = await loadModules(['esri/symbols/SimpleFillSymbol']);
    const [SimpleLineSymbol] = await loadModules(['esri/symbols/SimpleLineSymbol']);
    if (this.map.getLayer('freehand') !== undefined) {
      this.map.removeLayer(this.map.getLayer('freehand'));
    }
    const polyDraw = new Draw(this.map);
    polyDraw.activate(Draw.FREEHAND_POLYGON);
    polyDraw.on('draw-complete', (event) => {
      this.polyFreehand(event, polyDraw);
    });
  }

  async polyFreehand(evt, polyDraw) {
    await loadScript(option);
    const [Color] = await loadModules(['esri/Color']);
    const [Polygon] = await loadModules(['esri/geometry/Polygon']);
    const [GraphicsLayer] = await loadModules(['esri/layers/GraphicsLayer']);
    const [Graphic] = await loadModules(['esri/graphic']);
    const [Draw] = await loadModules(['esri/toolbars/draw']);
    const [SimpleFillSymbol] = await loadModules(['esri/symbols/SimpleFillSymbol']);
    const [SimpleLineSymbol] = await loadModules(['esri/symbols/SimpleLineSymbol']);

    const sym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
      new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
        new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25])
    );
    const layer = new GraphicsLayer({ id: 'freehand' });
    layer.add(new Graphic(evt.geographicGeometry, sym));
    this.map.addLayer(layer);
    polyDraw.deactivate();
  }
}

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { loadModules, loadScript, ILoadScriptOptions } from 'esri-loader';
import { HttpHeaders, HttpClient } from '@angular/common/http';
const option: ILoadScriptOptions = {
  url: 'https://js.arcgis.com/3.29/',
  css: 'https://js.arcgis.com/3.29/esri/css/esri.css'
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  displayedColumns: string[] = ['Location', 'Message', 'btn', 'fix'];
  gpLayer: any;
  map: any;
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
    window['zzz'] = this;
    this.fbConn.snapshotChanges().pipe(map(actions => {
      return actions.map(action => ({ key: action.key, value: action.payload.val() }));
    })).subscribe(items => {
      this.userDb = items;
      if (this.map) {
        this.map.removeLayer('local');
      }
      this.initMap();
    });

  }
  // call firebase!
  btnClick() {
    //let dateFormat = require('dateformat');
    const now = new Date();
    const pushDate = now.toLocaleString('TH');
    this.db.object('/trigger/time').set(pushDate);
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
    const [Color] = await loadModules(['esri/Color']);
    // const [Point] = await loadModules(['esri/geometry/Point']);
    // const [SpatialReference] = await loadModules(['esri/geometry/SpatialReference']);
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
    const layer = new GraphicsLayer({ id: 'local' });
    this.userDb.forEach((item, index) => {
      const point = item.value.location.split(',');
      const x = new Point(point[0], point[1], new SpatialReference({ wkid: 4326 }));
      layer.add(new Graphic(x, pin));
    });
    this.map.addLayer(layer);
  }

  goToC(point) {
    point = point.split(',');
    this.map.centerAt([point[0], point[1]]);
  }

  firebaseChangeStatus(id) {
    this.db.object('/user/' + id + '/mode').set(0);
    this.db.object('/user/' + id + '/step').set(0);
  }
  stealth() {
    const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': '3fOOYmIaudANxJYFCdWUtv6XsU4kJyDKgKct0X1b2Mnn0/kmLDQlqzhLvapZpYLbevCk5ZNcMZBa8CQ+JsYWNnc/dSzOjiDH1OlC8CtY9eGPlocdDw7TEyVawbLsmfEAuW80Nu0vcPxCCFeQCEH6HgdB04t89/1O/w1cDnyilFU= '
      })
    };
    const bodyx = JSON.stringify({
      to: `Ud89017efa0385812ac7ea495d84a5bed`,
      messages: [
        {
          type: `text`,
          text: 'Hello'// bodyResponse.events[0].message.text
        }
      ]
    });
    this.http.get(LINE_MESSAGING_API).subscribe(res => {
      const response = res;
    });
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
    const sym = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
      new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
        new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25])
    );
    const polygonJson = {
      "rings": [[[100, 13], [100, 14], [101, 14], [101, 13]]], "spatialReference": { "wkid": 4326 }
    };
    sym.setOutLine
    const x = new Polygon(polygonJson);
    const layer = new GraphicsLayer({ id: 'poly' });
    layer.add(new Graphic(x, sym));
    this.map.addLayer(layer);
  }

  async compareGeo() {
    await loadScript(option);
    const [geometryEngine] = await loadModules(['esri/geometry/geometryEngine']);

    const intersec = [];
    this.map.getLayer('local').graphics.forEach(async graphic => {
      const inThere = await geometryEngine.intersects(this.map.getLayer('poly').graphics[0].geometry, graphic.geometry);
      if (inThere) {
        intersec.push(graphic.geometry);
      }
    });
    console.log(intersec);
  }
}













// const stealth = (bodyResponse) => {
//   return request({
//       method: `POST`,
//       uri: `${LINE_MESSAGING_API}/push`,
//       headers: LINE_HEADER,
//       body: JSON.stringify({
//           to: `Ud89017efa0385812ac7ea495d84a5bed`,
//           messages: [
//               {
//                   type: `text`,
//                   text: JSON.stringify(bodyResponse, null, 2)// bodyResponse.events[0].message.text
//               }
//           ]
//       })
//   });
// };
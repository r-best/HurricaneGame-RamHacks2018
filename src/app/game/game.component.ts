import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren } from '@angular/core';
import { Http, Response } from '@angular/http';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements AfterViewInit {
    objectKeys = Object.keys;

    @ViewChild('game') canvasRef: ElementRef;
    @ViewChild('assets') assetsRef: ElementRef;

    WIDTH: number = 1280;
    HEIGHT: number = 720;

    numAssets: number;
    loadedAssets: number;

    context: CanvasRenderingContext2D;
    clickables: Clickable[];
    
    constructor(private http: Http) {
        http.get(`assets/coords.json`).pipe(
            map((res: Response) => res.json())
        ).toPromise().then(res => {
            res.bounds.forEach(bound =>
                this.clickables.push(new Clickable(
                    bound.points.map(point => new Coordinate(point[0], point[1])),
                    bound.text)
            ));
        });
    }

    ngAfterViewInit(){
        this.numAssets = this.assetsRef.nativeElement.childElementCount;
        this.loadedAssets = 0;
        this.context = this.canvasRef.nativeElement.getContext('2d');
        this.clickables = [];
        console.log(this.numAssets + ` asset(s)`);
    }

    /**
     * Called from HTML by each asset after it is done loading. Once the
     * counter has determined all elements are loaded, it initializes
     * the canvas.
     */
    assetLoaded(): void{
        this.loadedAssets++;
        console.log('Loaded asset ' + this.loadedAssets);
        if(this.loadedAssets == this.numAssets)
            this.initGame();
    }

    /**
     * Called from assetLoaded() once all assets are done loading,
     * draws the initial background image and creates all event
     * listeners required for the game
     */
    initGame(): void{
        this.context.drawImage(<HTMLImageElement>document.getElementById(`background1`), 0, 0, this.WIDTH, this.HEIGHT);
        let rect = this.canvasRef.nativeElement.getBoundingClientRect();
        this.canvasRef.nativeElement.addEventListener("mousemove", (e: MouseEvent) => this.draw(e.x-rect.left, e.y-rect.top), false);
        this.canvasRef.nativeElement.addEventListener("mouseup", (e: MouseEvent) => this.click(e.x-rect.left, e.y-rect.top), false);
    }

    /**
     * Called on every mouse move event, redraws the background and
     * draws whatever, if any, Clickables are under the cursor
     */
    draw(x: number, y: number): void{
        console.log("Drawing")
        this.context.drawImage(<HTMLImageElement>document.getElementById(`background1`), 0, 0, this.WIDTH, this.HEIGHT);
        for(let i = 0; i < this.clickables.length; i++)
            if(this.clickables[i].pointInPolygon(x, y)){
                this.clickables[i].draw(this.context);
                break;
            }
    }

    click(x: number, y: number): void {
        console.log("Clicking at point (" +x+ ", " +y+ ")");
        for(let i = 0; i < this.clickables.length; i++)
            if(this.clickables[i].pointInPolygon(x, y)){
                this.clickables[i].click();
                break;
            }
    }
}

class Clickable{
    points: Coordinate[];
    text: string;

    constructor(points: Coordinate[], text: string){
        this.points = points;
        this.text = text;
    }

    /**
     * Ray-casting point-in-polygon algorithm from https://github.com/substack/point-in-polygon
     * @param {number} x X value of point
     * @param {number} y Y value of point
     * @returns {boolean} Boolean for if the given point is within the bounds of the Clickable
     */
    pointInPolygon(x: number, y: number): boolean{
        let inside: boolean = false;
        let polygon: number[][] = this.points.map(coord => [coord.x, coord.y]);
        for(let i = 0, j = polygon.length-1; i < polygon.length; j = i++){
            let xi = polygon[i][0], yi = polygon[i][1];
            let xj = polygon[j][0], yj = polygon[j][1];

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if(intersect) inside = !inside;
        }

        return inside;
    }

    draw(context: CanvasRenderingContext2D): void{
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        for(let i = 1; i < this.points.length; i++){
            context.lineTo(this.points[i].x, this.points[i].y);
        }
        context.lineTo(this.points[0].x, this.points[0].y);
        context.stroke();
    }

    click(): void{
        console.log(this.text);
        //data-toggle = "modal";
        //data-target = "#myModal";
        // this.myModal.modal('myModal');
    }
}

class Coordinate{
    x: number;
    y: number;

    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }
}

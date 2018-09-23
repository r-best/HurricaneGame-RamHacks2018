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
    @ViewChild('progress') progressRef: ElementRef;
    @ViewChild('dialogButton') dialogButtonRef: ElementRef;

    WIDTH: number = 1280;
    HEIGHT: number = 720;

    numAssets: number;
    loadedAssets: number;

    context: CanvasRenderingContext2D;
    rooms: Room[];
    currentRoom: number;
    
    constructor(private http: Http) {
        this.rooms = [];
        this.currentRoom = 0;
        http.get(`assets/coords.json`).pipe(
            map((res: Response) => res.json())
        ).toPromise().then(res =>
            res.rooms.forEach(room => this.rooms.push(new Room(room.number,
                room.items.map(item => new Clickable(
                    item.points.map(point => new Coordinate(point[0], point[1])),
                    item.text, item.destination
                ))
            )))
        );
    }

    ngAfterViewInit(){
        this.numAssets = this.assetsRef.nativeElement.childElementCount;
        this.loadedAssets = 0;
        this.context = this.canvasRef.nativeElement.getContext('2d');
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
        this.context.drawImage(<HTMLImageElement>document.getElementById(`background${this.currentRoom}`), 0, 0, this.WIDTH, this.HEIGHT);
        let rect = this.canvasRef.nativeElement.getBoundingClientRect();
        this.canvasRef.nativeElement.addEventListener("mousemove", (e: MouseEvent) => this.draw(e.x-rect.left, e.y-rect.top), false);
        this.canvasRef.nativeElement.addEventListener("mouseup", (e: MouseEvent) => this.click(e.x-rect.left, e.y-rect.top), false);
    }

    /**
     * Called on every mouse move event, redraws the background and
     * draws whatever, if any, Clickables are under the cursor
     */
    draw(x: number, y: number): void{
        console.log("Drawing");
        this.rooms[this.currentRoom].draw(this.context, x, y, this.WIDTH, this.HEIGHT);
    }

    click(x: number, y: number): void {
        console.log("Clicking at point (" +x+ ", " +y+ ")");
        let destination = Math.abs(this.rooms[this.currentRoom].click(x, y, this.progressRef, this.dialogButtonRef));
        console.log(this.rooms[this.currentRoom].clicked, this.rooms[this.currentRoom].clickables.length)
        if(destination && this.rooms[this.currentRoom].clicked == this.rooms[this.currentRoom].clickables.length)
            this.currentRoom = destination;
    }
}

class Room{
    number: number;
    clickables: Clickable[];
    clicked: number;
    currentText: string;

    constructor(number: number, clickables: Clickable[]){
        this.number = number;
        this.clickables = clickables;
        this.clicked = 0;
    }

    draw(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void{
        context.drawImage(<HTMLImageElement>document.getElementById(`background${this.number}`), 0, 0, w, h);
        for(let i = 0; i < this.clickables.length; i++)
            if(this.clickables[i].pointInPolygon(x, y)){
                this.clickables[i].draw(context);
                break;
            }
    }

    click(x: number, y: number, progressRef: ElementRef, dialogButtonRef: ElementRef): number | null{
        for(let i = 0; i < this.clickables.length; i++)
            if(this.clickables[i].pointInPolygon(x, y)){
                this.currentText = this.clickables[i].text;
                dialogButtonRef.nativeElement.click();
                if(this.clickables[i].hasBeenClicked()){
                    if(this.clickables[i].destination)
                        return -1*this.clickables[i].destination;
                    return null;
                }
                else{
                    this.clicked++;
                    progressRef.nativeElement.style.width = `${this.clicked / this.clickables.length * 100}%`;
                    console.log("progress bar width: " + progressRef.nativeElement.style.width);
                    if(parseInt(progressRef.nativeElement.style.width) < 34) {
                      progressRef.nativeElement.className = "progress-bar bg-danger";
                    }
                    else if(parseInt(progressRef.nativeElement.style.width) < 67) {
                      progressRef.nativeElement.className = "progress-bar bg-warning";
                    }
                    else if(parseInt(progressRef.nativeElement.style.width) < 100) {
                      progressRef.nativeElement.className = "progress-bar bg-primary";
                    }
                    else if(parseInt(progressRef.nativeElement.style.width) < 101) {
                      progressRef.nativeElement.className = "progress-bar bg-success";
                    }
                    return this.clickables[i].click(); 
                }
            }
    }
}

class Clickable{
    points: Coordinate[];
    text: string;
    destination: number;
    wasClicked: boolean;

    constructor(points: Coordinate[], text: string, destination?: number){
        this.points = points;
        this.text = text;
        this.destination = destination || null;
        this.wasClicked = false;
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
        context.lineWidth=5;
        if(this.wasClicked) {
            context.strokeStyle="orange";
        }
        else {
            context.strokeStyle="lime";
        }
        context.moveTo(this.points[0].x, this.points[0].y);
        for(let i = 1; i < this.points.length; i++){
            context.lineTo(this.points[i].x, this.points[i].y);
        }
        context.lineTo(this.points[0].x, this.points[0].y);
        context.stroke();
    }

    click(): number | null{
        this.wasClicked = true;
        console.log(this.text);
        return this.destination;
    }

    /**
     * @returns true if this Clickable has not been clicked yet,
     * false if it has
     */
    hasBeenClicked(): boolean {
        return this.wasClicked;
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

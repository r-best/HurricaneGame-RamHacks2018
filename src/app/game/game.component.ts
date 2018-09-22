import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren } from '@angular/core';
import * as clickableData from `./coords.json`;

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
    
    constructor() { }

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
            this.initCanvas();
    }

    initCanvas(){
        this.context.drawImage(<HTMLImageElement>document.getElementById(`background1`), 0, 0, this.WIDTH, this.HEIGHT);
        console.log(clickableData)
        clickableData.bounds.forEach(bound =>
            this.clickables.push(new Clickable(
                bound.points.map(point => new Coordinate(point[0], point[1])),
                bound.text)
        ));
        console.log(this.clickables)
    }

}

class Clickable{
    points: Coordinate[];
    text: string;

    constructor(points: Coordinate[], text: string){
        this.points = points;
        this.text = text;
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

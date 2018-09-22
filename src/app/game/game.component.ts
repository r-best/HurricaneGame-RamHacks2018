import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements AfterViewInit {
    objectKeys = Object.keys;

    @ViewChild('game') canvasRef: ElementRef;
    @ViewChild('assets') assetsRef: ElementRef;
    @ViewChild('background1') background1: ElementRef;

    numAssets: number;
    loadedAssets: number;
    context: CanvasRenderingContext2D;

    constructor() { }

    ngAfterViewInit(){
        this.numAssets = this.assetsRef.nativeElement.childElementCount;
        this.loadedAssets = 0;
        this.context = this.canvasRef.nativeElement.getContext('2d');
        console.log(this.numAssets + ` asset(s)`)
        this.canvasRef.nativeElement.addEventListener("click",function(event){
          // Get the coordinates of the click
          var eventLocation = getEventLocation(this,event);
          console.log(eventLocation);
        },false);
    }

    /**
     * Called from HTML by each asset after it is done loading. Once the
     * counter has determined all elements are loaded, it initializes
     * the canvas.
     */
    assetLoaded(): void{
        this.loadedAssets++;
        console.log('Loaded asset')
        if(this.loadedAssets == this.numAssets)
            this.initCanvas();
    }

    initCanvas(){
        this.context.drawImage(<HTMLImageElement>document.getElementById(`background1`), 0, 0, 800, 600);
    }

}

function getElementPosition(obj) {
  var curleft = 0, curtop = 0;
  if (obj.offsetParent) {
      do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
      return { x: curleft, y: curtop };
  }
  return undefined;
}

function getEventLocation(element,event){
  // Relies on the getElementPosition function.
  var pos = getElementPosition(element);
  
  return {
    x: (event.pageX - pos.x),
    y: (event.pageY - pos.y)
  };
}


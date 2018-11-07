import {trackGestures} from './gesture-tracker.js';

function isBetween (v, a, b) {
    return (v > a && v <= b) || (v > b && v <= a);
}

export class VerticalSlider extends HTMLElement {
    constructor() {
        super();
        this._value = 12;
        this._inc = 0.1;
        this._min = 16;
        this._max = 10;
        this._pos = undefined;
        this._ref = undefined;
    }

    set value(v) {
        const newVal = 
            this._inc === undefined ?
            v :
            Math.round(v * (1 / this._inc)) / (1 / this._inc);
        if ( newVal === this._value || !isBetween(newVal, this._min, this._max)) return;
        this._value = newVal;
        this._positionThumb();
        this.dispatchEvent(new Event('input'));
    }

    get value() {
        return this._value;
    }

    _updateConversions() {
        this._valueToPx = (value) => this._length / (this._max - this._min) * (value - this._min);
        this._pxToValue = (px) => (px / this._length) * (this._max - this._min);
    }

    _positionThumb() {
        this._pos = this._valueToPx(this._value);
        this._thumb.style.transform = `translateY(${this._pos}px)`;
    }

    _updateMetrics() {
        this._thumbSize = this._thumb.getBoundingClientRect().height;
        this._length = this.getBoundingClientRect().height - this._thumbSize;
        this._updateConversions();
        this._positionThumb();
    }

    _handleDrag(events) {
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            switch (event.type) {
                case 'movestart':
                    this._ref = this._value;
                    break;
                case 'move':
                    this.value = (this._ref + this._pxToValue(event.deltaY));
                    break;
                case 'moveend':
                    this._ref = undefined;
            }
        }
    }

    _handleClick(event) {
        this.value = Math.max(this._min, this._max) + this._pxToValue(event.offsetY - (this._thumbSize / 2));
    }

    connectedCallback() {
        if (this._root === undefined) {
            this._root = this.attachShadow({mode: 'open'});
            this._root.innerHTML = `
                <style>
                    :host {
                        display: flex;
                        position: relative;
                    }

                    #track {
                        border-left: 2px solid white;
                        position: relative;
                        width: 0;
                        flex: 1;
                        left: calc(50% - 1px);
                        margin: 0.75em 0;
                    }
                    
                    #thumb {
                        position: absolute;
                        left: calc(50% - 0.75em);
                        height: 1.5em;
                        width: 1.5em;
                        border-radius: 50%;
                        background: white;
                    }
                </style>
                <div id="track"></div>
                <div id="thumb"></div>
            `;
            this._thumb = this._root.querySelector('#thumb');
            this._updateMetrics();
            trackGestures(e => this._handleDrag(e))(this._thumb);
            this.addEventListener('click', (e) => this._handleClick(e));
            new ResizeObserver(() => this._updateMetrics()).observe(this);
        }
    }
}

customElements.define('v-slider', VerticalSlider);
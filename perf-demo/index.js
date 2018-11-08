import 'virtual-scroller/virtual-scroller-element.js';
import '../lib/v-slider.js';

const itemTemplate = document.querySelector('template');
const blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

let frameReq = null;
const q = [];
function onNextFrame(fn) {
    q.push(fn);
    if (!frameReq) frameReq = window.requestAnimationFrame(() => {
        q.forEach(fn => fn());
        q.length = 0;
        frameReq = null;
    });
}

function createItem() {
    const el = document.importNode(itemTemplate.content, true).firstElementChild;
    el.$ = {
        image: el.querySelector('img'),
        // letter: el.querySelector('.letter'),
        name: el.querySelector('h2'),
        text: el.querySelector('p')
    }
    // el.$.text.addEventListener('click', () => el.$.text.textContent = "Hi!");
    return el;
}

function populateItem(el, data) {
    el.$.image.src = blank;
    // el.$.letter.textContent = data.name.substr(0, 1);
    el.$.name.textContent = data.name;
    el.$.text.textContent = data.mediumText;
    onNextFrame(() => el.$.image.src = data.image);
}

// function createItem() {
//     const el = document.createElement('div');
//     Object.assign(el.style, {
//         width: '100%',
//         height: '50px'
//     });
//     return el;
// }

// function populateItem(el, data) {
//     el.textContent = data.name;
// }

function makeEmAll(items) {
    items.forEach(item => {
        const el = createItem();
        populateItem(el, item);
        document.querySelector('.scrollable').appendChild(el);
    });
}

function setUpScroller(items) {
    const pool = [];
    const scroller = document.createElement('virtual-scroller');
    // scroller.setAttribute('layout', 'vertical-grid');
    scroller.className = 'scrollable';
    document.body.replaceChild(scroller, document.querySelector('.scrollable'));
    scroller.createElement = function() {
        return pool.pop() || createItem();
    };
    scroller.updateElement = populateItem;
    scroller.recycleElement = function(el) {
        el.parentNode.removeChild(el);
        pool.push(el);
    };
    scroller.itemSource = items;
}

function hookUpUI({jank}) {
    const settings = document.querySelector('#settings');
    let autoClose;
    const scheduleClose = () => {
        window.clearTimeout(autoClose);
        autoClose = window.setTimeout(() => settings.classList.remove('open'), 4000);
    }
    const revealJank = (fn) => {
        if (!jank) return fn();
        
        document.body.classList.add('janking');
        // setTimeout(() => {
        //     fn();
        //     requestAnimationFrame(() => document.body.classList.remove('janking'));
        // }, 0);
        setTimeout(() => {
            fn();
            let lastFrame = window.performance.now();
            let goodFrames = 0;
            function check() {
                const thisFrame = window.performance.now();
                const elapsed = thisFrame - lastFrame;
                if (elapsed < 64) {
                    if (goodFrames++ > 2) {
                        document.body.classList.remove('janking');
                        return;
                    }
                }
                else {
                    goodFrames = 0;
                }
                lastFrame = thisFrame;
                window.requestAnimationFrame(check);
            }
            window.requestAnimationFrame(check);
        }, 0);
        // fn();
    }
    document.querySelector('#gear')
        .addEventListener('click', () => { settings.classList.toggle('open'); scheduleClose(); });
    document.querySelector('v-slider')
        .addEventListener('input', e => { revealJank(() => document.body.style.fontSize = `${e.target.value}pt`); scheduleClose(); });
    document.querySelector('#dark')
        .addEventListener('click', () => { revealJank(() => document.body.classList.toggle('dark')); scheduleClose(); });
    document.querySelector('#compact')
        .addEventListener('click', () => { revealJank(() => document.body.classList.toggle('compact')); scheduleClose(); });
}

async function go() {
    const opts = window.location.search ? window.location.search.substr(1).split('&') : [];

    const jank = Boolean(opts.find(opt => opt === 'j'));
    hookUpUI({jank});
    
    const n = Number(opts.find(opt => opt.match(/\d/))) || 500;
    let items = [];
    const resp = await fetch('../contacts.json');
    const orig = await resp.json();
    while(items.length < n) {
        items = items.concat(orig);
    }
    items.length = n;
    
    const render = opts.find(opt => opt === 'v') ? setUpScroller : makeEmAll;
    render(items);
    window.items = items;
}

go();
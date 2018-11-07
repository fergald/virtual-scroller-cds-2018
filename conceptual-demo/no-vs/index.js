import 'virtual-scroller/virtual-scroller-element.js';

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
    el.$.text.addEventListener('click', () => el.$.text.textContent = "Hi!");
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
    const spacer = document.querySelector('.spacer');
    const scrollable = document.querySelector('.scrollable');
    spacer.style.height = scrollable.getBoundingClientRect().top;
    items.forEach(item => {
        const el = createItem();
        populateItem(el, item);
        document.querySelector('.content').insertBefore(el, spacer);
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

async function go() {
    const n = 50;
    let items = [];
    const resp = await fetch('../../contacts.json');
    const orig = await resp.json();
    while(items.length < n) {
        items = items.concat(orig);
    }
    items.length = n;
    const render = window.location.search === '?v' ? setUpScroller : makeEmAll;
    render(items);
    window.items = items;
}

go();
import test from 'node:test';
import assert from 'node:assert/strict';
import { projects } from '../dist/projects.mjs';

// Exercises the actual experience module with DOM state doubles. It does not
// verify browser rendering, native modal focus traps or pointer geometry.
class Element {
  constructor(id = '', attrs = {}) {
    this.id = id; this.attrs = {...attrs}; this.dataset = {}; this.listeners = {};
    this.style = {}; this.children = []; this.hidden = false; this.classes = new Set();
    this.classList = {add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),toggle:(x,force)=>{const next=force??!this.classes.has(x);next?this.classes.add(x):this.classes.delete(x);return next;},contains:x=>this.classes.has(x)};
    this.queries = {}; this.textContent = '';
  }
  setAttribute(key,value){this.attrs[key]=String(value);}
  getAttribute(key){return this.attrs[key]??null;}
  addEventListener(type,handler){(this.listeners[type]??=[]).push(handler);}
  querySelector(selector){return this.queries[selector]??null;}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  focus(){this.focused=true;}
  showModal(){this.open=true;}
  close(){this.open=false;this.fire('close');}
  click(){this.fire('click');}
  scrollIntoView(){this.scrolled=true;}
  async fire(type,extra={}){for(const handler of this.listeners[type]??[])await handler({target:this,currentTarget:this,preventDefault(){},...extra});}
}

test('the journey, bag, dialogs, workbench, tabs and motion controls work together',async()=>{
  const ids=['footer-visited-count','footer-visited-fill','footer-next-route','footer-next-label','footer-bag-open','footer-bag-count','bag-collection','bag-collection-count','bag-collection-fill','bag-collection-title','experience-feedback','visited-count','visited-fill','reset-journey','quick-dialog','bag-dialog','bag-open','bag-count','bag-empty','bag-clear','bag-items','shop-message','cat-tip','surprise-project','impact-select','urgency-select','priority-output','priority-explanation','lab-preset','lab-reset','panel-story','panel-process','motion-toggle','reading-progress','projetos'];
  const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
  const bookmarkIds=Object.keys(projects);
  const bookmarks=bookmarkIds.map(id=>{const node=new Element();node.dataset.bookmark=id;node.queries.span=new Element();return node;});
  const stopIds=['sobre','projetos','tecnologias','trajetoria','contato'];
  const links=stopIds.map(id=>{const node=new Element('',{href:`#${id}`});node.dataset.stop=id;node.queries.strong=new Element();node.queries.strong.textContent=id;return node;});
  const quickButton=new Element();
  const closeButtons=['quick-dialog','bag-dialog'].map(id=>{const node=new Element();node.dataset.close=id;elements[id].queries['.panel-close']=node;return node;});
  const tabs=['story','process'].map(id=>new Element(`tab-${id}`,{'aria-controls':`panel-${id}`}));
  const shortcuts=['backend','frontend','python'].map(filter=>{const node=new Element();node.dataset.skillFilter=filter;return node;});
  const filters=Object.fromEntries(['backend','frontend','python'].map(filter=>[filter,new Element()]));
  const result=new Element();
  const documentEvents={};
  const windowEvents={};
  const requests=[];
  const storageMap=new Map();
  const media={matches:false,addEventListener(type,fn){this.listener=fn;}};
  const body=new Element();
  const root=new Element();root.scrollHeight=4000;
  elements['impact-select'].value='medio';elements['urgency-select'].value='media';
  globalThis.document={
    body,documentElement:root,activeElement:quickButton,
    querySelector(selector){
      if(selector==='dialog[open]')return [elements['quick-dialog'],elements['bag-dialog']].find(x=>x.open)??null;
      if(selector==='.priority-result')return result;
      if(selector==='#bag-dialog .panel-close')return closeButtons[1];
      if(selector.startsWith('.filter[data-filter='))return filters[selector.match(/"([^\"]+)"/)[1]];
      if(selector.startsWith('#'))return elements[selector.slice(1)]??null;
      return null;
    },
    querySelectorAll(selector){return ({'[data-stop]':links,'a[href^="#"]':links,'[data-quick-open]':[quickButton],'[data-close]':closeButtons,'[data-close-link]':[],'.panel-dialog':[elements['quick-dialog'],elements['bag-dialog']],'[data-bookmark]':bookmarks,'.about-tabs [role="tab"]':tabs,'[data-skill-filter]':shortcuts}[selector]??[]);},
    getElementById:id=>elements[id],createElement:()=>new Element(),
    addEventListener:(type,fn)=>{documentEvents[type]=fn;},
    dispatchEvent:event=>requests.push(event),
  };
  globalThis.CustomEvent=class{constructor(type,options){this.type=type;this.detail=options.detail;}};
  globalThis.window={localStorage:{getItem:key=>storageMap.get(key)??null,setItem:(key,value)=>storageMap.set(key,value)},matchMedia:()=>media,innerHeight:1000,scrollY:0,requestAnimationFrame:fn=>fn(),addEventListener:(type,fn)=>{windowEvents[type]=fn;}};
  await import('../dist/experience.mjs');
  assert.match(elements['visited-count'].textContent,/0 de 5/);
  await links[0].fire('click');await links[0].fire('click');await links[1].fire('click');
  assert.match(elements['visited-count'].textContent,/2 de 5/);
  assert.equal(elements['visited-fill'].style.width,'40%');
  assert.equal(elements['footer-visited-count'].textContent,'2 de 5 lugares visitados');
  assert.equal(elements['footer-next-route'].getAttribute('href'),'#tecnologias');
  assert.equal(links[0].classList.contains('is-visited'),true);
  await elements['reset-journey'].fire('click');
  assert.match(elements['visited-count'].textContent,/0 de 5/);
  await bookmarks[0].fire('click');
  assert.equal(String(elements['bag-count'].textContent),'1');
  assert.equal(bookmarks[0].getAttribute('aria-pressed'),'true');
  assert.equal(elements['bag-collection-count'].textContent,'1 de 5 projetos na mochila');
  assert.equal(elements['footer-bag-count'].textContent,'1 de 5 projetos guardados');
  assert.equal(elements['bag-items'].children.length,1);
  assert.deepEqual(JSON.parse(storageMap.get('elza-projects-v1')),['fluxo']);
  await elements['bag-open'].fire('click');
  assert.equal(elements['bag-dialog'].open,true);
  assert.equal(closeButtons[1].focused,true);
  await elements['bag-items'].children[0].children[1].fire('click');
  assert.equal(elements['bag-dialog'].open,false);
  assert.equal(requests.at(-1).detail.id,'fluxo');
  assert.equal(requests.at(-1).detail.returnFocus,elements['bag-open']);
  await elements['bag-clear'].fire('click');
  assert.equal(String(elements['bag-count'].textContent),'0');
  assert.equal(elements['bag-empty'].hidden,false);
  await bookmarks[1].fire('click');
  await elements['footer-bag-open'].fire('click');
  assert.equal(elements['bag-dialog'].open,true);
  await elements['bag-items'].children[0].children[1].fire('click');
  assert.equal(requests.at(-1).detail.returnFocus,elements['footer-bag-open']);
  await elements['bag-clear'].fire('click');
  assert.equal(elements['bag-collection-count'].textContent,'0 de 5 projetos na mochila');
  await quickButton.fire('click');
  assert.equal(elements['quick-dialog'].open,true);
  await closeButtons[0].fire('click');
  assert.equal(elements['quick-dialog'].open,false);
  assert.equal(quickButton.focused,true);
  assert.equal(elements['priority-output'].children[0].textContent,'C');
  await elements['lab-preset'].fire('click');
  assert.equal(elements['priority-output'].children[0].textContent,'A');
  assert.match(elements['priority-explanation'].textContent,/Impacto alto.*urgência crítica.*prioridade crítica/);
  await elements['lab-reset'].fire('click');
  assert.equal(elements['priority-output'].children[0].textContent,'C');
  await tabs[1].fire('click');
  assert.equal(elements['panel-story'].hidden,true);
  assert.equal(tabs[1].getAttribute('aria-selected'),'true');
  await tabs[1].fire('keydown',{key:'ArrowLeft'});
  assert.equal(elements['panel-process'].hidden,true);
  assert.equal(tabs[0].focused,true);
  await elements['cat-tip'].fire('click');
  assert.match(elements['shop-message'].textContent,/entender o problema/);
  await elements['surprise-project'].fire('click');await elements['surprise-project'].fire('click');
  assert.equal(requests.at(-2).detail.id,'fluxo');
  assert.equal(requests.at(-1).detail.id,'lacrei');
  assert.equal(requests.at(-1).detail.returnFocus,elements['surprise-project']);
  for (const button of bookmarks.slice(0,3)) await button.fire('click');
  assert.equal(elements['bag-collection-count'].textContent,'3 de 5 projetos na mochila');
  assert.equal(elements['bag-collection'].classList.contains('is-complete'),false);
  for (const button of bookmarks.slice(3)) await button.fire('click');
  assert.equal(elements['bag-collection-count'].textContent,'5 de 5 projetos na mochila');
  assert.equal(elements['bag-collection-title'].textContent,'Coleção do ateliê completa');
  assert.equal(elements['bag-collection'].classList.contains('is-complete'),true);
  assert.equal(elements['bag-collection-fill'].style.width,'100%');
  await bookmarks[4].fire('click');
  assert.equal(elements['bag-collection-title'].textContent,'4 ideias para explorar');
  assert.equal(elements['bag-collection'].classList.contains('is-complete'),false);
  await elements['motion-toggle'].fire('click');
  assert.equal(root.classList.contains('motion-paused'),true);
  assert.equal(elements['motion-toggle'].getAttribute('aria-pressed'),'true');
  assert.equal(JSON.parse(storageMap.get('elza-motion-v1')),true);
  media.matches=true;media.listener();
  assert.equal(elements['motion-toggle'].disabled,true);
  assert.match(elements['motion-toggle'].getAttribute('aria-label'),/dispositivo/);
  window.scrollY=750;windowEvents.scroll();
  assert.equal(elements['reading-progress'].style.transform,'scaleX(0.25)');
});

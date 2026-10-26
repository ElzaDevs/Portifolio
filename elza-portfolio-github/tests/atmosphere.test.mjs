import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mountCats } from '../dist/cats.mjs';
import { mountTheme } from '../dist/theme.mjs';
import { mountForest } from '../dist/forest.mjs';

class Element {
  constructor(){this.attrs={};this.dataset={};this.handlers=new Map();this.children=[];this.classes=new Set();this.values={};this.style={setProperty:(k,v)=>{this.values[k]=v;}};this.classList={contains:k=>this.classes.has(k),add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),toggle:(k,on)=>{const value=on??!this.classes.has(k);value?this.classes.add(k):this.classes.delete(k);return value;}};}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}
  addEventListener(k,fn){this.handlers.set(k,[...(this.handlers.get(k)??[]),fn]);}removeEventListener(k,fn){this.handlers.set(k,(this.handlers.get(k)??[]).filter(v=>v!==fn));}
  emit(k,e={}){(this.handlers.get(k)??[]).forEach(fn=>fn({target:this,...e}));}
  replaceChildren(...children){this.children=children;}focus(){this.focused=true;}showModal(){this.open=true;}close(){this.open=false;this.emit('close');}
  getBoundingClientRect(){return{left:20,right:600,top:20,bottom:650};}
}

test('cat surprise is explicit, chooses different cats/messages, preserves native dismissal and obeys motion policy',()=>{
  const ids=Object.fromEntries(['header-cat','tree-curiosity','cat-surprise','cat-visitors','cat-surprise-title','cat-surprise-note','cat-surprise-close','cat-surprise-again','cat-surprise-back'].map(id=>[id,new Element()]));
  const cats=Array.from({length:3},()=>new Element());ids['cat-surprise'].querySelectorAll=()=>cats;
  const document=new Element();document.body=new Element();document.getElementById=id=>ids[id];document.createElement=()=>new Element();document.createTextNode=text=>({textContent:text});document.querySelector=()=>ids['cat-surprise'].open?ids['cat-surprise']:null;
  const media=new Element(),timers=new Map();let serial=0,observer;
  const window={matchMedia:()=>media,setTimeout(fn){timers.set(++serial,fn);return serial;},clearTimeout(id){timers.delete(id);},MutationObserver:class{constructor(fn){this.fn=fn;observer=this;}observe(){}disconnect(){this.disconnected=true;}}};
  const app=mountCats({document,window,random:()=>0});
  assert.equal(ids['cat-surprise'].open,undefined);assert.equal(timers.size,0);assert.equal(ids['tree-curiosity'].disabled,false);
  ids['tree-curiosity'].emit('click');assert.equal(ids['cat-surprise'].open,true);assert.equal(ids['cat-surprise-close'].focused,true);assert.equal(document.body.classList.contains('dialog-open'),true);
  assert.match(ids['cat-surprise-title'].children[0].textContent,/curiosidade/);assert.equal(new Set(cats.map(cat=>cat.dataset.coat)).size,3);assert.equal(timers.size,1);
  const previous=cats[1].dataset.coat;ids['cat-surprise-again'].emit('click');assert.notEqual(cats[1].dataset.coat,previous);assert.match(ids['cat-surprise-title'].children[0].textContent,/bug/);assert.equal(timers.size,1);
  document.body.classList.add('motion-paused');observer.fn();assert.equal(timers.size,0);assert.equal(ids['cat-visitors'].classList.contains('is-jumping'),false);
  ids['cat-surprise-again'].emit('click');assert.equal(timers.size,0);assert.equal(ids['cat-surprise'].open,true);
  ids['cat-surprise-back'].emit('click');assert.equal(ids['cat-surprise'].open,false);assert.equal(ids['tree-curiosity'].focused,true);assert.equal(document.body.classList.contains('dialog-open'),false);
  ids['tree-curiosity'].focused=false;ids['header-cat'].emit('click');assert.equal(ids['cat-surprise'].open,true);assert.equal(cats[1].dataset.coat,'ink');ids['cat-surprise-back'].emit('click');assert.equal(ids['header-cat'].focused,true);assert.equal(ids['tree-curiosity'].focused,false);
  document.body.classList.remove('motion-paused');media.matches=true;app.open();assert.equal(timers.size,0);ids['cat-surprise-close'].emit('click');
  media.matches=false;app.open();document.hidden=true;document.emit('visibilitychange');assert.equal(timers.size,0);
  ids['cat-surprise'].emit('click',{clientX:0,clientY:0});assert.equal(ids['cat-surprise'].open,false);
  app.dispose();assert.equal(observer.disconnected,true);assert.ok(Object.values(ids).every(n=>[...n.handlers.values()].every(list=>list.length===0)));
});

test('day/night updates all UI state, persists the actual choice and tolerates corrupt or denied storage',()=>{
  const ids=Object.fromEntries(['light-toggle','theme-icon','theme-status'].map(id=>[id,new Element()]));const body=new Element(),meta=new Element();const values=new Map();
  const document={body,getElementById:id=>ids[id],querySelector:()=>meta};
  const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  let app=mountTheme({document,window:{localStorage:storage}});
  assert.equal(body.classList.contains('night'),false);assert.equal(ids['theme-icon'].getAttribute('href'),'#sun');
  ids['light-toggle'].emit('click');assert.equal(body.classList.contains('night'),true);assert.equal(body.classList.contains('evening'),true);assert.equal(ids['theme-icon'].getAttribute('href'),'#moon');assert.equal(ids['light-toggle'].getAttribute('aria-label'),'Mudar para o dia');assert.match(ids['theme-status'].textContent,/noite/);assert.equal(meta.getAttribute('content'),'#15251e');assert.equal(values.get('elza-night-v1'),'true');
  app.dispose();app=mountTheme({document,window:{localStorage:storage}});assert.equal(body.classList.contains('night'),true);
  ids['light-toggle'].emit('click');assert.equal(body.classList.contains('night'),false);assert.equal(ids['theme-icon'].getAttribute('href'),'#sun');app.dispose();
  values.set('elza-night-v1','invalid JSON');app=mountTheme({document,window:{localStorage:storage}});assert.equal(body.classList.contains('night'),false);app.dispose();
  const locked={get localStorage(){throw Error('denied');}};app=mountTheme({document,window:locked});ids['light-toggle'].emit('click');assert.equal(body.classList.contains('night'),true);app.dispose();
});

test('forest framing has real bounded positions, accessible presets and an independent light control',()=>{
  const ids=Object.fromEntries(['forest-scene','forest-controls','forest-pan','forest-light','forest-view-output'].map(id=>[id,new Element()]));ids['forest-light'].setAttribute('aria-pressed','true');
  const buttons=['rio','bosque','copas'].map(id=>{const button=new Element();button.dataset.forestView=id;return button;});
  const app=mountForest({document:{getElementById:id=>ids[id],querySelectorAll:()=>buttons}});
  assert.equal(ids['forest-controls'].hidden,false);assert.equal(ids['forest-scene'].values['--forest-position'],'50%');
  buttons[0].emit('click');assert.equal(ids['forest-scene'].values['--forest-position'],'30%');assert.equal(buttons[0].getAttribute('aria-pressed'),'true');
  assert.equal(app.setView('missing'),false);ids['forest-pan'].value=900;ids['forest-pan'].emit('input');assert.equal(ids['forest-pan'].value,'80');assert.equal(ids['forest-scene'].values['--forest-position'],'80%');assert.ok(buttons.every(b=>b.getAttribute('aria-pressed')==='false'));
  ids['forest-pan'].value='invalid';ids['forest-pan'].emit('input');assert.equal(ids['forest-scene'].values['--forest-position'],'80%');
  ids['forest-light'].emit('click');assert.equal(ids['forest-scene'].dataset.rays,'off');ids['forest-light'].emit('click');assert.equal(ids['forest-scene'].dataset.rays,'on');
  app.dispose();assert.ok([...buttons,...Object.values(ids)].every(n=>[...n.handlers.values()].every(list=>list.length===0)));
});

function luminance(hex){const v=hex.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722;}
test('night palette keeps key reading and action colors above 4.5:1',()=>{
  const css=fs.readFileSync(new URL('../dist/night.css',import.meta.url),'utf8');const p=Object.fromEntries([...css.matchAll(/--(night-[\w-]+):#([a-f\d]{6})/g)].map(m=>[m[1],m[2]]));
  for(const [foreground,background] of [[p['night-text'],p['night-card']],[p['night-muted'],p['night-card']],[p['night-accent'],p['night-panel']],['23351e','b6cd88']]){const a=luminance(foreground),b=luminance(background);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);}
});

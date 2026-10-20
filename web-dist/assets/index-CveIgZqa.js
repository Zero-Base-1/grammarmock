var ot=Object.defineProperty;var ct=(n,t,e)=>t in n?ot(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var A=(n,t,e)=>ct(n,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function e(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(a){if(a.ep)return;a.ep=!0;const i=e(a);fetch(a.href,i)}})();var h=(n=>(n.LITERAL="LITERAL",n.CHAR_CLASS="CHAR_CLASS",n.OR="OR",n.STAR="STAR",n.PLUS="PLUS",n.QUESTION="QUESTION",n.QUANTIFIER="QUANTIFIER",n.LPAREN="LPAREN",n.RPAREN="RPAREN",n.ANCHOR_START="ANCHOR_START",n.ANCHOR_END="ANCHOR_END",n.EOF="EOF",n))(h||{});class k extends Error{constructor(t,e){super(`Lexer Error at position ${e}: ${t}`),this.position=e,this.name="LexerError"}}class lt{constructor(t){A(this,"input");A(this,"pos",0);A(this,"len");this.input=t,this.len=t.length}tokenize(){const t=[];for(;this.pos<this.len;){const e=this.input[this.pos];if(e==="^")t.push({type:h.ANCHOR_START,value:"^",position:this.pos}),this.pos++;else if(e==="$")t.push({type:h.ANCHOR_END,value:"$",position:this.pos}),this.pos++;else if(e==="|")t.push({type:h.OR,value:"|",position:this.pos}),this.pos++;else if(e==="*")t.push({type:h.STAR,value:"*",position:this.pos,quantifier:{min:0,max:1/0}}),this.pos++;else if(e==="+")t.push({type:h.PLUS,value:"+",position:this.pos,quantifier:{min:1,max:1/0}}),this.pos++;else if(e==="?")t.push({type:h.QUESTION,value:"?",position:this.pos,quantifier:{min:0,max:1}}),this.pos++;else if(e==="("){const s=this.pos;if(this.input.startsWith("(?:",s))t.push({type:h.LPAREN,value:"(?:",position:s}),this.pos+=3;else{if(this.input.startsWith("(?=",s)||this.input.startsWith("(?!",s)||this.input.startsWith("(?<=",s)||this.input.startsWith("(?<!",s))throw new k("Lookaround assertions (lookahead/lookbehind) are non-regular extensions and cannot be represented in a Type-3 Right-Linear Grammar.",s);if(this.input.startsWith("(?",s))throw new k(`Unsupported regex extension '${this.input.slice(s,s+4)}' is not valid in a regular grammar.`,s);t.push({type:h.LPAREN,value:"(",position:s}),this.pos++}}else e===")"?(t.push({type:h.RPAREN,value:")",position:this.pos}),this.pos++):e==="{"?t.push(this.readQuantifier()):e==="["?t.push(this.readCharacterClass()):e==="."?(t.push({type:h.CHAR_CLASS,value:".",position:this.pos,charClass:{negated:!1,ranges:[],chars:[],isWildcard:!0}}),this.pos++):e==="\\"?t.push(this.readEscape()):(t.push({type:h.LITERAL,value:e,position:this.pos}),this.pos++)}return t.push({type:h.EOF,value:"",position:this.pos}),t}readQuantifier(){const t=this.pos,e=this.input.indexOf("}",t);if(e===-1)throw new k('Unterminated quantifier: missing closing "}"',t);const s=this.input.slice(t+1,e).trim(),a=s.split(",").map(c=>c.trim());let i=0,o=1/0;if(a.length===1){if(!/^\d+$/.test(a[0]))throw new k(`Invalid quantifier format: "{${s}}"`,t);i=parseInt(a[0],10),o=i}else if(a.length===2){if(!/^\d+$/.test(a[0]))throw new k(`Invalid quantifier minimum: "${a[0]}"`,t);if(i=parseInt(a[0],10),a[1]==="")o=1/0;else{if(!/^\d+$/.test(a[1]))throw new k(`Invalid quantifier maximum: "${a[1]}"`,t);if(o=parseInt(a[1],10),o<i)throw new k(`Quantifier range out of order: min ${i} > max ${o}`,t)}}else throw new k(`Invalid quantifier format: "{${s}}"`,t);return this.pos=e+1,{type:h.QUANTIFIER,value:this.input.slice(t,this.pos),position:t,quantifier:{min:i,max:o}}}readEscape(){const t=this.pos;if(this.pos++,this.pos>=this.len)throw new k("Trailing backslash at end of pattern",t);const e=this.input[this.pos];if(this.pos++,/^[1-9]$/.test(e))throw new k(`Backreferences (e.g. \\${e}) require context-sensitive matching and cannot be represented in a Type-3 Right-Linear Grammar.`,t);if(e==="d")return{type:h.CHAR_CLASS,value:"\\d",position:t,charClass:{negated:!1,ranges:[{from:"0",to:"9"}],chars:[]}};if(e==="D")return{type:h.CHAR_CLASS,value:"\\D",position:t,charClass:{negated:!0,ranges:[{from:"0",to:"9"}],chars:[]}};if(e==="w")return{type:h.CHAR_CLASS,value:"\\w",position:t,charClass:{negated:!1,ranges:[{from:"a",to:"z"},{from:"A",to:"Z"},{from:"0",to:"9"}],chars:["_"]}};if(e==="W")return{type:h.CHAR_CLASS,value:"\\W",position:t,charClass:{negated:!0,ranges:[{from:"a",to:"z"},{from:"A",to:"Z"},{from:"0",to:"9"}],chars:["_"]}};if(e==="s")return{type:h.CHAR_CLASS,value:"\\s",position:t,charClass:{negated:!1,ranges:[],chars:[" ","	"]}};if(e==="S")return{type:h.CHAR_CLASS,value:"\\S",position:t,charClass:{negated:!0,ranges:[],chars:[" ","	","\r",`
`]}};if(e==="t")return{type:h.LITERAL,value:"	",position:t};if(e==="n")return{type:h.LITERAL,value:`
`,position:t};if(e==="r")return{type:h.LITERAL,value:"\r",position:t};if(e==="x"&&this.pos+2<=this.len){const s=this.input.slice(this.pos,this.pos+2);if(/^[0-9a-fA-F]{2}$/.test(s))return this.pos+=2,{type:h.LITERAL,value:String.fromCharCode(parseInt(s,16)),position:t}}return{type:h.LITERAL,value:e,position:t}}readCharacterClass(){const t=this.pos;this.pos++;let e=!1;this.pos<this.len&&this.input[this.pos]==="^"&&(e=!0,this.pos++);const s=[],a=[];for(this.pos<this.len&&this.input[this.pos]==="]"&&(a.push("]"),this.pos++);this.pos<this.len&&this.input[this.pos]!=="]";){let o;const c=this.input[this.pos];if(c==="\\"){if(this.pos++,this.pos>=this.len)throw new k("Unterminated escape in character class",t);const l=this.input[this.pos];if(this.pos++,l==="d"){s.push({from:"0",to:"9"});continue}else if(l==="w"){s.push({from:"a",to:"z"},{from:"A",to:"Z"},{from:"0",to:"9"}),a.push("_");continue}else if(l==="s"){a.push(" ","	");continue}else l==="t"?o="	":l==="n"?o=`
`:l==="r"?o="\r":o=l}else o=c,this.pos++;if(this.pos<this.len&&this.input[this.pos]==="-"&&this.pos+1<this.len&&this.input[this.pos+1]!=="]"){this.pos++;let l;const p=this.input[this.pos];if(p==="\\"){if(this.pos++,this.pos>=this.len)throw new k("Unterminated escape in character class range",t);const g=this.input[this.pos];this.pos++,l=g}else l=p,this.pos++;if(o.charCodeAt(0)>l.charCodeAt(0))throw new k(`Character class range out of order: '${o}' > '${l}'`,t);s.push({from:o,to:l})}else a.push(o)}if(this.pos>=this.len||this.input[this.pos]!=="]")throw new k('Unterminated character class: missing closing "]"',t);this.pos++;const i={negated:e,ranges:s,chars:a};return{type:h.CHAR_CLASS,value:this.input.slice(t,this.pos),position:t,charClass:i}}}class Q extends Error{constructor(t,e){super(`Parser Error at position ${e}: ${t}`),this.position=e,this.name="ParserError"}}class B{constructor(t){A(this,"tokens");A(this,"current",0);this.tokens=t}static parse(t){const s=new lt(t).tokenize();return new B(s).parseRegex()}parseRegex(){const t=this.parseUnion();if(!this.isAtEnd()){const e=this.peek();throw new Q(`Unexpected token '${e.value}' at end of pattern`,e.position)}return t}parseUnion(){const t=[this.parseConcat()];for(;this.match(h.OR);)t.push(this.parseConcat());return t.length===1?t[0]:{type:"union",options:t}}parseConcat(){const t=[];for(;!this.isAtEnd()&&this.peek().type!==h.OR&&this.peek().type!==h.RPAREN;)t.push(this.parseFactor());return t.length===0?{type:"empty"}:t.length===1?t[0]:{type:"concat",children:t}}parseFactor(){const t=this.parseAtom(),e=this.peek();if(e.type===h.STAR||e.type===h.PLUS||e.type===h.QUESTION||e.type===h.QUANTIFIER){this.advance();const s=e.quantifier;return{type:"repetition",child:t,min:s.min,max:s.max}}return t}parseAtom(){const t=this.peek();if(t.type===h.ANCHOR_START||t.type===h.ANCHOR_END)return this.advance(),{type:"empty"};if(t.type===h.LITERAL)return this.advance(),{type:"literal",char:t.value};if(t.type===h.CHAR_CLASS)return this.advance(),{type:"char_class",negated:t.charClass.negated,ranges:t.charClass.ranges,chars:t.charClass.chars,isWildcard:t.charClass.isWildcard};if(t.type===h.LPAREN){const e=this.advance(),s=this.parseUnion();if(!this.match(h.RPAREN))throw new Q('Unclosed parenthesis: expected ")"',e.position);return s}throw new Q(`Unexpected token '${t.value}'`,t.position)}match(...t){for(const e of t)if(this.check(e))return this.advance(),!0;return!1}check(t){return this.isAtEnd()?!1:this.peek().type===t}advance(){return this.isAtEnd()||this.current++,this.previous()}isAtEnd(){return this.peek().type===h.EOF}peek(){return this.tokens[this.current]}previous(){return this.tokens[this.current-1]}}class tt{constructor(t,e=!1){A(this,"id");A(this,"transitions",[]);A(this,"isAccept",!1);this.id=t,this.isAccept=e}addTransition(t,e){this.transitions.push({label:t,target:e})}addEpsilonTransition(t){this.transitions.push({label:{type:"epsilon"},target:t})}}class et{constructor(t,e){A(this,"startState");A(this,"acceptStates");this.startState=t,this.acceptStates=e}getAllStates(){const t=new Set,e=[this.startState];for(;e.length>0;){const s=e.pop();if(!t.has(s)){t.add(s);for(const a of s.transitions)t.has(a.target)||e.push(a.target)}}return Array.from(t)}renumber(){this.getAllStates().forEach((e,s)=>{e.id=s})}}class st{constructor(){A(this,"stateId",0)}createState(t=!1){return new tt(this.stateId++,t)}build(t){const e=this.buildFragment(t);e.accept.isAccept=!0;const s=new et(e.start,new Set([e.accept]));return s.renumber(),s}buildFragment(t){switch(t.type){case"empty":return this.fromEmpty();case"literal":return this.fromLiteral(t.char);case"char_class":return this.fromCharClass(t);case"concat":return this.concat(t.children.map(e=>this.buildFragment(e)));case"union":return this.union(t.options.map(e=>this.buildFragment(e)));case"repetition":return this.repetition(t.child,t.min,t.max)}}fromLiteral(t){const e=this.createState(),s=this.createState();return e.addTransition({type:"literal",char:t},s),{start:e,accept:s}}fromCharClass(t){const e=this.createState(),s=this.createState(),a={type:"char_class",negated:t.negated,ranges:t.ranges,chars:t.chars,isWildcard:t.isWildcard};return e.addTransition(a,s),{start:e,accept:s}}fromEmpty(){const t=this.createState(),e=this.createState();return t.addEpsilonTransition(e),{start:t,accept:e}}concat(t){if(t.length===0)return this.fromEmpty();if(t.length===1)return t[0];for(let e=0;e<t.length-1;e++)t[e].accept.addEpsilonTransition(t[e+1].start);return{start:t[0].start,accept:t[t.length-1].accept}}union(t){if(t.length===0)return this.fromEmpty();if(t.length===1)return t[0];const e=this.createState(),s=this.createState();for(const a of t)e.addEpsilonTransition(a.start),a.accept.addEpsilonTransition(s);return{start:e,accept:s}}star(t){const e=this.createState(),s=this.createState();return e.addEpsilonTransition(t.start),e.addEpsilonTransition(s),t.accept.addEpsilonTransition(t.start),t.accept.addEpsilonTransition(s),{start:e,accept:s}}plus(t){const e=this.createState(),s=this.createState();return e.addEpsilonTransition(t.start),t.accept.addEpsilonTransition(t.start),t.accept.addEpsilonTransition(s),{start:e,accept:s}}optional(t){const e=this.createState(),s=this.createState();return e.addEpsilonTransition(t.start),e.addEpsilonTransition(s),t.accept.addEpsilonTransition(s),{start:e,accept:s}}repetition(t,e,s){if(e===0&&s===1/0)return this.star(this.buildFragment(t));if(e===1&&s===1/0)return this.plus(this.buildFragment(t));if(e===0&&s===1)return this.optional(this.buildFragment(t));if(e===0&&s===0)return this.fromEmpty();const a=[];for(let i=0;i<e;i++)a.push(this.buildFragment(t));if(s===1/0)return a.push(this.star(this.buildFragment(t))),this.concat(a);for(let i=0;i<s-e;i++)a.push(this.optional(this.buildFragment(t)));return this.concat(a)}}function dt(n){const t=new Set([n]),e=[n];for(;e.length>0;){const s=e.pop();for(const a of s.transitions)a.label.type==="epsilon"&&!t.has(a.target)&&(t.add(a.target),e.push(a.target))}return t}function pt(n){const t=n.getAllStates(),e=new Map;for(const l of t)e.set(l,dt(l));const s=new Map,a=l=>{let p=s.get(l);return p||(p=new tt(l),s.set(l,p)),p},i=new Set;for(const l of t){const p=a(l.id),g=e.get(l);for(const S of g)if(S.isAccept){p.isAccept=!0,i.add(p);break}const f=new Set;for(const S of g)for(const y of S.transitions)if(y.label.type!=="epsilon"){const $=a(y.target.id),u=`${JSON.stringify(y.label)}->${$.id}`;f.has(u)||(f.add(u),p.addTransition(y.label,$))}}const o=a(n.startState.id),c=new et(o,i);return c.renumber(),c}function at(n,t=!0){const e=t?pt(n):n,s=e.getAllStates(),a=l=>`S${l.id}`,i=s.map(l=>a(l)),o=a(e.startState),c=new Map;for(const l of s){const p=a(l),g=[];l.isAccept&&g.push({type:"epsilon"});for(const f of l.transitions){const S=a(f.target);if(f.label.type==="epsilon")g.push({type:"unit",nextVariable:S});else{const y=f.label.type==="literal"?{type:"literal",char:f.label.char}:{type:"char_class",negated:f.label.negated,ranges:f.label.ranges,chars:f.label.chars,isWildcard:f.label.isWildcard};g.push({type:"step",terminal:y,nextVariable:S})}}c.set(p,g)}return{variables:i,startVariable:o,productions:c}}class ut{constructor(t){A(this,"state");t===void 0?this.state=Math.floor(Math.random()*4294967295):this.state=t>>>0}next(){let t=this.state+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}nextInt(t,e){const s=this.next();return Math.floor(s*(e-t+1))+t}choice(t){if(t.length===0)throw new Error("Cannot choose from empty array");const e=this.nextInt(0,t.length-1);return t[e]}}function ht(n,t){if(n.type==="literal")return n.char;if(n.isWildcard)return String.fromCharCode(t.nextInt(32,126));if(n.negated){const e=[];for(let s=32;s<=126;s++){const a=String.fromCharCode(s);let i=!1;for(const o of n.ranges)if(s>=o.from.charCodeAt(0)&&s<=o.to.charCodeAt(0)){i=!0;break}!i&&n.chars.includes(a)&&(i=!0),i||e.push(a)}return e.length===0?"a":t.choice(e)}else{let e=0;const s=[];for(const i of n.ranges){const o=i.to.charCodeAt(0)-i.from.charCodeAt(0)+1;s.push(o),e+=o}if(e+=n.chars.length,e===0)return"";let a=t.nextInt(0,e-1);for(let i=0;i<n.ranges.length;i++){const o=s[i];if(a<o){const c=n.ranges[i].from.charCodeAt(0)+a;return String.fromCharCode(c)}a-=o}return n.chars[a]}}function mt(n){if(n.type==="literal")return[n.char];if(n.isWildcard){const t=[];for(let e=32;e<=126;e++)t.push(String.fromCharCode(e));return t}if(n.negated){const t=[];for(let e=32;e<=126;e++){const s=String.fromCharCode(e);let a=!1;for(const i of n.ranges)if(e>=i.from.charCodeAt(0)&&e<=i.to.charCodeAt(0)){a=!0;break}!a&&n.chars.includes(s)&&(a=!0),a||t.push(s)}return t}else{const t=new Set;for(const e of n.ranges){const s=e.from.charCodeAt(0),a=e.to.charCodeAt(0);for(let i=s;i<=a;i++)t.add(String.fromCharCode(i))}for(const e of n.chars)t.add(e);return Array.from(t).sort((e,s)=>e.charCodeAt(0)-s.charCodeAt(0))}}class ft{constructor(t){A(this,"grammar");A(this,"minDistanceToAccept",new Map);this.grammar=t,this.computeDistancesToAccept()}computeDistancesToAccept(){const t=new Map,e=[];for(const s of this.grammar.variables)t.set(s,[]);for(const[s,a]of this.grammar.productions.entries()){let i=!1;for(const o of a)if(o.type==="epsilon")i=!0;else{const c=o.nextVariable,l=t.get(c)||[];l.push(s),t.set(c,l)}i&&(this.minDistanceToAccept.set(s,0),e.push(s))}for(;e.length>0;){const s=e.shift(),a=this.minDistanceToAccept.get(s),i=t.get(s)||[];for(const o of i)this.minDistanceToAccept.has(o)||(this.minDistanceToAccept.set(o,a+1),e.push(o))}}generateBulk(t,e={}){const s=[],a=e.maxRepeat??5,i=e.maxTotalSteps??a*Math.max(1,this.grammar.variables.length)+50,o=this.minDistanceToAccept.get(this.grammar.startVariable)??0;for(let c=o;c<=i&&(this.dfs(this.grammar.startVariable,c,"",new Map,a,s,t),!(s.length>=t));c++);return s.slice(0,t)}dfs(t,e,s,a,i,o,c){if(o.length>=c||(this.minDistanceToAccept.get(t)??1/0)>e)return;const p=this.grammar.productions.get(t)||[];if(e===0){p.some($=>$.type==="epsilon")&&o.push(s);return}const g=p.filter(y=>y.type==="step"),f=p.filter(y=>y.type==="unit");for(const y of f){const $=a.get(y.nextVariable)||0;if($<i&&(a.set(y.nextVariable,$+1),this.dfs(y.nextVariable,e,s,a,i,o,c),a.set(y.nextVariable,$),o.length>=c))return}const S=[];for(const y of g){const $=mt(y.terminal);for(const u of $)S.push({char:u,nextVariable:y.nextVariable})}S.sort((y,$)=>y.char.localeCompare($.char));for(const{char:y,nextVariable:$}of S){const u=a.get($)||0;if(u<i&&(a.set($,u+1),this.dfs($,e-1,s+y,a,i,o,c),a.set($,u),o.length>=c))return}}}class gt{constructor(t,e){A(this,"grammar");A(this,"prng");A(this,"minDistanceToAccept",new Map);A(this,"sequentialGen");this.grammar=t,this.prng=new ut(e),this.computeDistancesToAccept()}computeDistancesToAccept(){const t=new Map,e=[];for(const s of this.grammar.variables)t.set(s,[]);for(const[s,a]of this.grammar.productions.entries()){let i=!1;for(const o of a)if(o.type==="epsilon")i=!0;else{const c=o.nextVariable,l=t.get(c)||[];l.push(s),t.set(c,l)}i&&(this.minDistanceToAccept.set(s,0),e.push(s))}for(;e.length>0;){const s=e.shift(),a=this.minDistanceToAccept.get(s),i=t.get(s)||[];for(const o of i)this.minDistanceToAccept.has(o)||(this.minDistanceToAccept.set(o,a+1),e.push(o))}}generate(t={}){if(t.mode==="chronological"||t.mode==="sequential")return this.generateBulk(1,t)[0]??"";const e=t.maxRepeat??5,s=t.maxTotalSteps??2e3;let a=this.grammar.startVariable;const i=new Map,o=[];let c=0;for(;c<s;){c++;const l=(i.get(a)||0)+1;i.set(a,l);const p=this.grammar.productions.get(a)||[];if(p.length===0)break;let g=p;if(l>=e){if(p.find(u=>u.type==="epsilon"))break;const y=this.minDistanceToAccept.get(a)??1/0,$=p.filter(u=>u.type==="epsilon"?!0:(this.minDistanceToAccept.get(u.nextVariable)??1/0)<y||u.nextVariable!==a);$.length>0&&(g=$)}const f=this.prng.choice(g);if(f.type==="epsilon")break;if(f.type==="unit"){a=f.nextVariable;continue}if(f.type==="step"){const S=ht(f.terminal,this.prng);o.push(S),a=f.nextVariable}}return o.join("")}generateBulk(t,e={}){if(e.mode==="chronological"||e.mode==="sequential")return this.sequentialGen||(this.sequentialGen=new ft(this.grammar)),this.sequentialGen.generateBulk(t,{maxRepeat:e.maxRepeat,maxTotalSteps:e.maxTotalSteps});const s=[];for(let a=0;a<t;a++)s.push(this.generate(e));return s}}function vt(n){if(n.isWildcard)return".";const t=[];for(const s of n.ranges)t.push(`${s.from}-${s.to}`);for(const s of n.chars)t.push(s===" "?"\\s":s);const e=t.join("");return n.negated?`[^${e}]`:`[${e}]`}function _(n,t="",e=!0,s=!0){const a=s?"":t+(e?"└── ":"├── "),i=s?"":t+(e?"    ":"│   ");switch(n.type){case"empty":return`${a}Empty (ε)
`;case"literal":return`${a}Literal: '${n.char}'
`;case"char_class":return`${a}CharClass: ${vt(n)}
`;case"concat":{let o=`${a}Concat
`;return n.children.forEach((c,l)=>{o+=_(c,i,l===n.children.length-1,!1)}),o}case"union":{let o=`${a}Union (|)
`;return n.options.forEach((c,l)=>{o+=_(c,i,l===n.options.length-1,!1)}),o}case"repetition":{const o=n.max===1/0?"∞":n.max.toString();let c=`${a}Repetition {${n.min}, ${o}}
`;return c+=_(n.child,i,!0,!1),c}}}function yt(n){if(n.type==="literal")return`'${n.char}'`;if(n.isWildcard)return".";const t=[];for(const s of n.ranges)t.push(`${s.from}-${s.to}`);for(const s of n.chars)t.push(s===" "?"\\s":s);const e=t.join("");return n.negated?`[^${e}]`:`[${e}]`}function bt(n){switch(n.type){case"epsilon":return"ε";case"unit":return n.nextVariable;case"step":return`${yt(n.terminal)} ${n.nextVariable}`}}function St(n){const t=[];t.push("Right-Linear Grammar G = (V, Σ, R, S)"),t.push(`Variables (V)   : { ${n.variables.join(", ")} }`),t.push(`Start Symbol (S): ${n.startVariable}`),t.push(`
Production Rules (R):`);for(const e of n.variables){const s=n.productions.get(e)||[];if(s.length===0)continue;const a=s.map(bt);t.push(`  ${e.padEnd(4)} -> ${a.join(" | ")}`)}return t.join(`
`)}function At(n,t=!0){const e=B.parse(n),a=new st().build(e);return at(a,t)}function xt(n,t,e={}){const s=At(n);return new gt(s,e.seed).generateBulk(t,e)}function K(n){const t=n.label;if(t.type==="epsilon")return"ε";if(t.type==="literal")return t.char===" "?"␣":`'${t.char}'`;if(t.type==="char_class"){if(t.isWildcard)return".";const e=[];for(const a of t.ranges)e.push(`${a.from}-${a.to}`);for(const a of t.chars)e.push(a);const s=e.join("");return t.negated?`[^${s}]`:`[${s}]`}return"?"}function $t(n){const t=n.getAllStates().sort((i,o)=>i.id-o.id),e=new Set;for(const i of t)for(const o of i.transitions)e.add(K(o));const s=Array.from(e).sort((i,o)=>i==="ε"?-1:o==="ε"?1:i.localeCompare(o)),a=new Map;for(const i of t){const o=new Map;for(const c of s)o.set(c,[]);for(const c of i.transitions){const l=K(c),p=o.get(l)??[];p.includes(c.target.id)||p.push(c.target.id),o.set(l,p)}a.set(i.id,o)}return{states:t,symbols:s,matrix:a}}class Et{constructor(t){A(this,"container");A(this,"nfa",null);A(this,"selectedStateId",null);A(this,"zoom",1);A(this,"panX",40);A(this,"panY",40);A(this,"isPanning",!1);A(this,"startPan",{x:0,y:0});this.container=t}setNFA(t){this.nfa=t,this.selectedStateId=null,this.resetView(),this.render()}resetView(){this.zoom=1,this.panX=80,this.panY=220}zoomIn(){const t=this.container.getBoundingClientRect(),e=t.width>0?t.width/2:400,s=t.height>0?t.height/2:220,a=Math.min(4,this.zoom*1.2);this.panX=e-(e-this.panX)*(a/this.zoom),this.panY=s-(s-this.panY)*(a/this.zoom),this.zoom=a,this.applyTransform()}zoomOut(){const t=this.container.getBoundingClientRect(),e=t.width>0?t.width/2:400,s=t.height>0?t.height/2:220,a=Math.max(.15,this.zoom/1.2);this.panX=e-(e-this.panX)*(a/this.zoom),this.panY=s-(s-this.panY)*(a/this.zoom),this.zoom=a,this.applyTransform()}fitView(){this.resetView(),this.applyTransform()}applyTransform(){const t=this.container.querySelector("#automata-viewport");t&&t.setAttribute("transform",`translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);const e=this.container.querySelector(".zoom-level-text");e&&(e.textContent=`${Math.round(this.zoom*100)}%`)}render(){if(!this.nfa){this.container.innerHTML=`
        <div class="automata-empty">
          <p>No automaton compiled yet. Enter a valid pattern to visualize the state machine.</p>
        </div>`;return}const t=this.nfa.getAllStates();if(t.length===0){this.container.innerHTML='<div class="automata-empty"><p>Automaton has no states.</p></div>';return}const e=new Map,s=[{state:this.nfa.startState,rank:0}];e.set(this.nfa.startState.id,0);const a=new Set([this.nfa.startState.id]);for(;s.length>0;){const{state:u,rank:d}=s.shift();for(const T of u.transitions)a.has(T.target.id)||(a.add(T.target.id),e.set(T.target.id,d+1),s.push({state:T.target,rank:d+1}))}for(const u of t)e.has(u.id)||e.set(u.id,0);const i=new Map;for(const u of t){const d=e.get(u.id)??0,T=i.get(d)??[];T.push(u),i.set(d,T)}const o=new Map,c=150,l=95,p=Array.from(i.keys()).sort((u,d)=>u-d);for(const u of p){const d=i.get(u)??[],E=0-(d.length-1)*l/2;d.forEach((C,m)=>{const v=u*c,R=E+m*l;o.set(C.id,{x:v,y:R})})}const g=[],f=new Map;for(const u of t){const d=o.get(u.id);if(d)for(const T of u.transitions){const E=o.get(T.target.id);if(!E)continue;const C=K(T),m=`${u.id}->${T.target.id}`,v=f.get(m)??0;f.set(m,v+1);const R=u.id===T.target.id,I=E.x<d.x,M=E.x===d.x&&u.id!==T.target.id,O=this.selectedStateId===u.id||this.selectedStateId===T.target.id;if(R){const H=24+v*8,U=d.x-12,z=d.y-20,P=d.x+12,D=d.y-20,L=`M ${U} ${z} C ${d.x-H} ${d.y-50-v*15}, ${d.x+H} ${d.y-50-v*15}, ${P} ${D}`;g.push(`
            <g class="transition-edge ${O?"highlight":""}">
              <path d="${L}" class="edge-path" marker-end="url(#arrow)" />
              <rect x="${d.x-14}" y="${d.y-48-v*15}" width="28" height="16" class="edge-label-bg" rx="2" />
              <text x="${d.x}" y="${d.y-37-v*15}" class="edge-label">${this.esc(C)}</text>
            </g>
          `)}else if(I||M){const H=I?-60-v*20:E.y>d.y?35:-35,U=(d.x+E.x)/2,z=(d.y+E.y)/2+H,P=E.x-d.x,D=E.y-d.y,L=Math.atan2(D,P),N=22,X=d.x+N*Math.cos(L),q=d.y+N*Math.sin(L),G=E.x-(N+4)*Math.cos(L),Z=E.y-(N+4)*Math.sin(L),it=`M ${X} ${q} Q ${U} ${z} ${G} ${Z}`;g.push(`
            <g class="transition-edge ${O?"highlight":""}">
              <path d="${it}" class="edge-path" marker-end="url(#arrow)" />
              <rect x="${U-16}" y="${z-8}" width="32" height="16" class="edge-label-bg" rx="2" />
              <text x="${U}" y="${z+4}" class="edge-label">${this.esc(C)}</text>
            </g>
          `)}else{const U=E.x-d.x,z=E.y-d.y,P=Math.atan2(z,U),D=d.x+22*Math.cos(P),L=d.y+22*Math.sin(P),N=E.x-26*Math.cos(P),X=E.y-26*Math.sin(P);if(v>0){const q=(D+N)/2,G=(L+X)/2+v*25*(v%2===0?1:-1),Z=`M ${D} ${L} Q ${q} ${G} ${N} ${X}`;g.push(`
              <g class="transition-edge ${O?"highlight":""}">
                <path d="${Z}" class="edge-path" marker-end="url(#arrow)" />
                <rect x="${q-16}" y="${G-8}" width="32" height="16" class="edge-label-bg" rx="2" />
                <text x="${q}" y="${G+4}" class="edge-label">${this.esc(C)}</text>
              </g>
            `)}else{const q=(D+N)/2,G=(L+X)/2;g.push(`
              <g class="transition-edge ${O?"highlight":""}">
                <line x1="${D}" y1="${L}" x2="${N}" y2="${X}" class="edge-path" marker-end="url(#arrow)" />
                <rect x="${q-14}" y="${G-10}" width="28" height="16" class="edge-label-bg" rx="2" />
                <text x="${q}" y="${G+2}" class="edge-label">${this.esc(C)}</text>
              </g>
            `)}}}}const S=[],y=u=>{var d;return u.id===((d=this.nfa)==null?void 0:d.startState.id)},$=u=>{var d;return(d=this.nfa)==null?void 0:d.acceptStates.has(u)};for(const u of t){const d=o.get(u.id);if(!d)continue;const T=this.selectedStateId===u.id,E=$(u),C=y(u);let m="";C&&(m=`
          <g class="start-indicator">
            <line x1="${d.x-56}" y1="${d.y}" x2="${d.x-24}" y2="${d.y}" class="start-arrow-line" marker-end="url(#start-arrow)" />
            <text x="${d.x-40}" y="${d.y-7}" class="start-label">START</text>
          </g>
        `),S.push(`
        ${m}
        <g class="state-node ${T?"selected":""} ${E?"accept-node":""}" data-state-id="${u.id}" transform="translate(${d.x}, ${d.y})">
          <circle r="22" class="state-outer-circle" />
          ${E?'<circle r="17" class="state-inner-circle" />':""}
          <text dy="5" class="state-text">q${u.id}</text>
        </g>
      `)}this.container.innerHTML=`
      <div class="automata-canvas-wrapper">
        <div class="automata-toolbar">
          <div class="toolbar-info">
            <span class="toolbar-stat"><strong>${t.length}</strong> STATES</span>
            <span class="toolbar-stat"><strong>${this.nfa.acceptStates.size}</strong> ACCEPT</span>
            <span class="toolbar-stat">START: <strong>q${this.nfa.startState.id}</strong></span>
          </div>
          <div class="canvas-controls">
            <button class="canvas-btn" data-action="zoom-in" title="Zoom In">+</button>
            <span class="zoom-level-text">${Math.round(this.zoom*100)}%</span>
            <button class="canvas-btn" data-action="zoom-out" title="Zoom Out">−</button>
            <button class="canvas-btn" data-action="fit" title="Reset View">RESET</button>
          </div>
        </div>
        <div class="automata-viewport-container">
          <svg class="automata-svg" style="width: 100%; height: 100%; overflow: visible; pointer-events: all;">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" class="marker-path" />
              </marker>
              <marker id="start-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" class="start-marker-path" />
              </marker>
            </defs>
            <rect width="10000" height="10000" x="-5000" y="-5000" fill="transparent" class="canvas-bg-hitbox" style="pointer-events: all;" />
            <g id="automata-viewport" transform="translate(${this.panX}, ${this.panY}) scale(${this.zoom})">
              <g class="edges-layer">${g.join("")}</g>
              <g class="states-layer">${S.join("")}</g>
            </g>
          </svg>
        </div>
      </div>
    `,this.attachEvents()}attachEvents(){const t=this.container.querySelector(".automata-viewport-container"),e=this.container.querySelector(".automata-svg");if(!t||!e)return;const s=this.container.querySelector('[data-action="zoom-in"]'),a=this.container.querySelector('[data-action="zoom-out"]'),i=this.container.querySelector('[data-action="fit"]');s==null||s.addEventListener("click",()=>this.zoomIn()),a==null||a.addEventListener("click",()=>this.zoomOut()),i==null||i.addEventListener("click",()=>this.fitView()),t.addEventListener("mousedown",c=>{if(c.button!==0||c.target.closest(".state-node"))return;c.preventDefault(),this.isPanning=!0,this.startPan={x:c.clientX-this.panX,y:c.clientY-this.panY},t.classList.add("panning"),e.classList.add("panning");const p=f=>{this.isPanning&&(f.preventDefault(),this.panX=f.clientX-this.startPan.x,this.panY=f.clientY-this.startPan.y,this.applyTransform())},g=()=>{this.isPanning=!1,t.classList.remove("panning"),e.classList.remove("panning"),window.removeEventListener("mousemove",p),window.removeEventListener("mouseup",g)};window.addEventListener("mousemove",p),window.addEventListener("mouseup",g)}),e.addEventListener("wheel",c=>{c.preventDefault();const l=e.getBoundingClientRect(),p=c.clientX-l.left,g=c.clientY-l.top,f=c.deltaY<0?1.15:1/1.15,S=Math.min(4,Math.max(.15,this.zoom*f));this.panX=p-(p-this.panX)*(S/this.zoom),this.panY=g-(g-this.panY)*(S/this.zoom),this.zoom=S,this.applyTransform()},{passive:!1}),this.container.querySelectorAll(".state-node").forEach(c=>{c.addEventListener("click",l=>{l.stopPropagation();const p=Number(c.dataset.stateId);this.selectedStateId===p?this.selectedStateId=null:this.selectedStateId=p,this.render()})})}esc(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}}const W=[{name:"Employee ID",pattern:"^[A-Z]{3}-\\d{4}$",category:"Identity & HR"},{name:"Email Handle",pattern:"^[a-z]{3,8}\\.[a-z]{3,8}@[a-z]{3,8}\\.(com|org|net)$",category:"Identity & HR"},{name:"Product SKU",pattern:"^[A-Z]{2}-[0-9]{4}-[A-Z]{2}$",category:"Commerce & Inventory"},{name:"Credit Card",pattern:"^4[0-9]{3}-[0-9]{4}-[0-9]{4}-[0-9]{4}$",category:"Commerce & Inventory"},{name:"Invoice ID",pattern:"^INV-202[0-9]-[0-9]{5}$",category:"Commerce & Inventory"},{name:"UUID v4",pattern:"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",category:"Software & Dev"},{name:"SemVer 2.0",pattern:"^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(-(alpha|beta|rc)\\.[1-9])?$",category:"Software & Dev"},{name:"API Route",pattern:"^/(GET|POST|PUT)/api/v[1-3]/[a-z]{3,8}$",category:"Software & Dev"},{name:"Hex Color",pattern:"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$",category:"Software & Dev"},{name:"IPv4 CIDR",pattern:"^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(1[6-9]|2[0-9]|3[0-2])$",category:"Network & Infra"},{name:"MAC Address",pattern:"^([0-9A-F]{2}:){5}[0-9A-F]{2}$",category:"Network & Infra"},{name:"ISO Date",pattern:"^202[0-9]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$",category:"Network & Infra"}],r={pattern:"^[A-Z]{3}-\\d{4}$",count:25,mode:"random",format:"text",maxRepeat:5,seed:"",activeTab:"automata",theme:localStorage.getItem("gm_theme")||"dark",records:[],searchQuery:"",showShortcuts:!1,showGuide:!1,showMatrix:!1,history:[],ast:null,nfa:null,grammar:null,error:null},b=document.querySelector("#app");let j=null;function x(n){return n.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function nt(){document.documentElement.setAttribute("data-theme",r.theme),localStorage.setItem("gm_theme",r.theme)}function Tt(){r.theme=r.theme==="dark"?"light":"dark",nt(),w()}function V(){if(!r.pattern.trim()){r.ast=null,r.nfa=null,r.grammar=null,r.error=null;return}try{const n=B.parse(r.pattern),e=new st().build(n),s=at(e,!0);r.ast=n,r.nfa=e,r.grammar=s,r.error=null}catch(n){r.error=n instanceof Error?n.message:"Pattern compilation failed.",r.ast=null,r.nfa=null,r.grammar=null}}function Y(){if(V(),r.error||!r.pattern.trim()){F("Fix pattern syntax before generating records.");return}try{const n={mode:r.mode,maxRepeat:r.maxRepeat,...r.seed.trim()?{seed:Number(r.seed)}:{}},t=xt(r.pattern,r.count,n);r.records=t;const e=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});r.history.unshift({pattern:r.pattern,count:t.length,mode:r.mode,time:e}),r.history.length>5&&r.history.pop(),F(`Generated ${t.length} records`),w()}catch(n){r.error=n instanceof Error?n.message:"Generation traversal failed.",w()}}function F(n){const t=document.querySelector("#toast-message");t&&(t.textContent=n,t.classList.add("visible"),window.setTimeout(()=>t.classList.remove("visible"),2200))}function J(n,t){return t==="json"?JSON.stringify(n,null,2):t==="csv"?["value",...n.map(e=>/[",\n]/.test(e)?`"${e.replace(/"/g,'""')}"`:e)].join(`
`):t==="ts"?`/** Generated by GrammarMock (Chomsky Type-3 Automaton) */
export type GeneratedRecord =
${n.slice(0,100).map(s=>`  | ${JSON.stringify(s)}`).join(`
`)};
`:n.join(`
`)}function wt(n){if(n.length===0)return"0.00";const t=n.join("");if(t.length===0)return"0.00";const e=new Map;for(const i of t)e.set(i,(e.get(i)??0)+1);let s=0;const a=t.length;for(const i of e.values()){const o=i/a;s-=o*Math.log2(o)}return s.toFixed(2)}function rt(n="header-preset-select",t="header-preset-select"){const e=W.some(i=>i.pattern===r.pattern),a=Array.from(new Set(W.map(i=>i.category))).map(i=>{const o=W.filter(c=>c.category===i).map(c=>`<option value="${x(c.pattern)}" ${r.pattern===c.pattern?"selected":""}>${x(c.name)}</option>`).join("");return`<optgroup label="── ${x(i.toUpperCase())}">${o}</optgroup>`}).join("");return`
    <select id="${n}" class="${t}" aria-label="Pattern Presets">
      <option value="" disabled ${e?"":"selected"}>${e?"Select Preset...":"Custom Pattern..."}</option>
      ${a}
    </select>
  `}function Rt(){return`
    <header class="workbench-header">
      <div class="brand-section">
        <div class="brand-glyph">GM</div>
        <div class="brand-title">GrammarMock</div>
        <span class="brand-badge">CHOMSKY TYPE-3 STUDIO</span>
      </div>
      <div class="header-center">
        <div class="header-preset-section">
          <label class="header-preset-label" for="header-preset-select">PRESETS</label>
          ${rt("header-preset-select","header-preset-select")}
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" id="guide-btn" title="How to Use Data Generation">
          <span>[i]</span> GUIDE
        </button>
        <button class="icon-btn" id="shortcuts-btn" title="View Keyboard Shortcuts">
          <span>[?]</span> KEYS
        </button>
        <button class="icon-btn theme-toggle-btn" id="theme-btn" title="Toggle Dark/Light Mode">
          <span>${r.theme==="dark"?"☀ LIGHT":"● DARK"}</span>
        </button>
      </div>
    </header>
  `}const kt=typeof navigator<"u"&&/Mac|iPod|iPhone|iPad/.test(navigator.platform),Ct=kt?"⌘":"Ctrl";function Lt(){const n=r.nfa?r.nfa.getAllStates().length:0,t=r.grammar?r.grammar.productions.size:0,e=r.history.length>0?r.history.map(s=>`
        <div class="history-item">
          <span class="history-pattern" data-load-history="${x(s.pattern)}" title="${x(s.pattern)}">/${x(s.pattern)}/</span>
          <span class="history-meta">${s.count} rec · ${s.time}</span>
        </div>
      `).join(""):'<div style="color: var(--ink-muted); font-size: 11px; font-family: var(--font-mono);">No previous runs in this session.</div>';return`
    <aside class="left-pane">
      <div class="left-pane-scroll">
        <div class="pane-section">
          <div class="section-title">
            <span>REGULAR EXPRESSION</span>
            ${rt("pane-preset-select","pane-preset-select")}
          </div>
        <div class="regex-editor-wrap">
          <div class="regex-delimiters">
            <span class="regex-slash">/</span>
            <textarea
              id="pattern-input"
              class="regex-input"
              placeholder="^[A-Z]{3}-\\d{4}$"
              spellcheck="false"
              rows="2"
            >${x(r.pattern)}</textarea>
            <span class="regex-slash">/</span>
          </div>
          <div class="editor-footer-status">
            <div class="compile-status ${r.error?"error":"valid"}">
              <span class="status-dot"></span>
              <span>${r.error?"SYNTAX ERROR":"VALID GRAMMAR"}</span>
            </div>
            <div class="ast-stat">
              ${r.error?"CHECK EXPRESSION":`${n} STATES · ${t} PRODUCTIONS`}
            </div>
          </div>
        </div>
        ${r.error?`<div class="error-notice" role="alert">${x(r.error)}</div>`:""}

        <details class="input-instructions-box" open>
          <summary class="input-instructions-summary">
            <span>HOW & WHAT TO INPUT</span>
          </summary>
          <div class="input-instructions-content">
            <div class="instructions-rule">
              Enter regular expressions enclosed between <code>^</code> and <code>$</code>.
            </div>
            <div class="quick-tokens-grid">
              <button type="button" class="token-chip" data-insert="[A-Z]{3}" title="Insert 3 uppercase letters">
                <code>[A-Z]{3}</code>
                <span>Letters</span>
              </button>
              <button type="button" class="token-chip" data-insert="\\d{4}" title="Insert 4 digits">
                <code>\\d{4}</code>
                <span>Digits</span>
              </button>
              <button type="button" class="token-chip" data-insert="[a-z0-9]" title="Insert alphanumeric character">
                <code>[a-z0-9]</code>
                <span>Alphanum</span>
              </button>
              <button type="button" class="token-chip" data-insert="(US|CA|EU)" title="Insert alternation choices">
                <code>(A|B)</code>
                <span>Choices</span>
              </button>
              <button type="button" class="token-chip" data-insert="{2,5}" title="Insert repetition range">
                <code>{2,5}</code>
                <span>Range</span>
              </button>
              <button type="button" class="token-chip" data-insert="[0-9A-F]{2}" title="Insert 2 hex characters">
                <code>[0-9A-F]</code>
                <span>Hex</span>
              </button>
            </div>
            <div class="instructions-footer">
              <span>Need help? <a href="#" id="view-guide-tab-link">Open Full Input Guide (Tab 4) →</a></span>
            </div>
          </div>
        </details>
      </div>

      <div class="pane-section">
        <div class="section-title">
          <span>TRAVERSAL PARAMETERS</span>
        </div>
        <div class="params-grid">
          <div class="param-item">
            <label class="param-label" for="count-input">RECORD COUNT</label>
            <input id="count-input" class="param-input" type="number" min="1" max="10000" value="${r.count}" />
            <span class="param-hint">Number of strings (1 - 10,000)</span>
          </div>
          <div class="param-item">
            <label class="param-label" for="mode-input">TRAVERSAL ENGINE</label>
            <select id="mode-input" class="param-select">
              <option value="random" ${r.mode==="random"?"selected":""}>Random Walk (Biased BFS)</option>
              <option value="chronological" ${r.mode==="chronological"?"selected":""}>Chronological (Shortlex)</option>
            </select>
            <span class="param-hint">Random walk vs Sequential Shortlex</span>
          </div>
          <div class="param-item">
            <label class="param-label" for="format-input">EXPORT FORMAT</label>
            <select id="format-input" class="param-select">
              <option value="text" ${r.format==="text"?"selected":""}>Plain Text (.txt)</option>
              <option value="json" ${r.format==="json"?"selected":""}>JSON Array (.json)</option>
              <option value="csv" ${r.format==="csv"?"selected":""}>CSV Format (.csv)</option>
              <option value="ts" ${r.format==="ts"?"selected":""}>TypeScript Union (.ts)</option>
            </select>
            <span class="param-hint">File type for download or clipboard</span>
          </div>
          <div class="param-item">
            <label class="param-label" for="repeat-input">MAX REPEAT (* / +)</label>
            <input id="repeat-input" class="param-input" type="number" min="1" max="100" value="${r.maxRepeat}" />
            <span class="param-hint">Bounds loop depth for * and +</span>
          </div>
        </div>

        <details class="advanced-details">
          <summary class="advanced-summary">DETERMINISTIC SEEDING</summary>
          <div class="advanced-fields">
            <div class="param-item">
              <label class="param-label" for="seed-input">PRNG INTEGER SEED (OPTIONAL)</label>
              <input id="seed-input" class="param-input" type="number" placeholder="Leave blank for random" value="${x(r.seed)}" />
              <span class="param-hint">Seed (e.g. 42) ensures 100% identical outputs</span>
            </div>
          </div>
        </details>
      </div>

        <div class="pane-section">
          <div class="section-title">
            <span>SESSION HISTORY</span>
          </div>
          <div class="history-list">${e}</div>
        </div>
      </div>

      <div class="execute-btn-wrap">
        <button id="generate-btn" class="execute-btn">
          <span>EXECUTE GENERATION</span>
          <span class="kbd-hint">${Ct} ↵</span>
        </button>
      </div>
    </aside>
  `}function It(){let n="";if(r.nfa&&r.showMatrix){const t=$t(r.nfa),e=t.symbols.map(a=>`<th>${x(a)}</th>`).join(""),s=t.states.map(a=>{var p,g;const i=t.matrix.get(a.id),o=t.symbols.map(f=>{const S=(i==null?void 0:i.get(f))??[];return`<td>${S.length>0?S.map(y=>`q${y}`).join(", "):"—"}</td>`}).join(""),c=(p=r.nfa)!=null&&p.acceptStates.has(a)?" (ACCEPT)":"";return`
        <tr>
          <td class="matrix-state-cell">${((g=r.nfa)==null?void 0:g.startState.id)===a.id?" → ":""}q${a.id}${c}</td>
          ${o}
        </tr>
      `}).join("");n=`
      <section class="matrix-section">
        <div class="matrix-header">
          <span class="matrix-title">FORMAL TRANSITION MATRIX δ(q, σ)</span>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">STATES × SYMBOLS</span>
        </div>
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="matrix-state-cell">STATE</th>
                ${e}
              </tr>
            </thead>
            <tbody>${s}</tbody>
          </table>
        </div>
      </section>
    `}return`
    <div class="automata-tab-view">
      <div id="automata-canvas-mount"></div>
      <div style="padding: 0 20px 16px; display: flex; justify-content: flex-end;">
        <button id="toggle-matrix-btn" class="icon-btn">
          ${r.showMatrix?"HIDE TRANSITION MATRIX":"SHOW TRANSITION MATRIX δ(q, σ)"}
        </button>
      </div>
      ${n}
    </div>
  `}function Mt(){if(r.records.length===0)return`
      <div class="stream-tab-view">
        <div class="automata-empty" style="border: 1px solid var(--border); background: var(--surface);">
          <p>No records generated yet. Click <strong>EXECUTE GENERATION</strong> (or press Cmd+Enter) to populate stream.</p>
        </div>
      </div>
    `;const n=r.searchQuery.trim()?r.records.filter(c=>c.toLowerCase().includes(r.searchQuery.toLowerCase())):r.records,t=r.records.map(c=>c.length),e=Math.min(...t),s=Math.max(...t),a=(t.reduce((c,l)=>c+l,0)/t.length).toFixed(1),i=wt(r.records),o=n.map((c,l)=>{let p=x(c);if(r.searchQuery.trim()){const g=x(r.searchQuery),f=new RegExp(g,"gi");p=p.replace(f,S=>`<mark>${S}</mark>`)}return`
      <div class="record-row">
        <span class="record-idx">${l+1}</span>
        <span class="record-val">${p}</span>
        <span class="record-meta">${c.length} chars</span>
      </div>
    `}).join("");return`
    <div class="stream-tab-view">
      <div class="stream-summary-bar">
        <div class="summary-stats">
          <div class="summary-stat-group">
            <span class="summary-stat-label">TOTAL RECORDS</span>
            <span class="summary-stat-val">${r.records.length}</span>
          </div>
          <div class="summary-stat-group">
            <span class="summary-stat-label">LENGTH (MIN / AVG / MAX)</span>
            <span class="summary-stat-val">${e} / ${a} / ${s}</span>
          </div>
          <div class="summary-stat-group">
            <span class="summary-stat-label">SHANNON ENTROPY</span>
            <span class="summary-stat-val">${i} bits</span>
          </div>
          <div class="compliance-badge">
            <span>✓</span>
            <span>100% REGEX COMPLIANT</span>
          </div>
        </div>
        <div class="stream-actions">
          <button id="copy-stream-btn" class="icon-btn">COPY TO CLIPBOARD</button>
          <button id="export-stream-btn" class="icon-btn">DOWNLOAD FILE</button>
        </div>
      </div>

      <div class="stream-container">
        <div class="stream-filter-bar">
          <input
            id="stream-search-input"
            class="filter-input"
            type="text"
            placeholder="Search records in stream..."
            value="${x(r.searchQuery)}"
          />
          <span class="filter-count">SHOWING ${n.length} OF ${r.records.length}</span>
        </div>
        <div class="records-feed">${o}</div>
      </div>
    </div>
  `}function Nt(){if(!r.grammar||!r.ast)return`
      <div class="grammar-tab-view">
        <div class="automata-empty" style="border: 1px solid var(--border); background: var(--surface);">
          <p>No grammar compiled. Enter a valid regular expression.</p>
        </div>
      </div>
    `;const n=St(r.grammar),t=_(r.ast),e=Array.from(r.grammar.productions.entries()).map(([s,a])=>{var c;const i=s===((c=r.grammar)==null?void 0:c.startVariable),o=a.map(l=>{if(l.type==="step"){const p=l.terminal.type==="literal"?`'${l.terminal.char}'`:"[class]";return`<li>→ ${x(p)} ${l.nextVariable}</li>`}return l.type==="unit"?`<li>→ ${l.nextVariable}</li>`:"<li>→ ε (halt)</li>"}).join("");return`
      <div class="production-card">
        <div class="production-lhs">${s}${i?" (START)":""}</div>
        <ul class="production-rhs-list">${o}</ul>
      </div>
    `}).join("");return`
    <div class="grammar-tab-view">
      <section class="grammar-panel">
        <div class="grammar-panel-header">
          <span class="grammar-panel-title">CHOMSKY TYPE-3 PRODUCTIONS (RIGHT-LINEAR GRAMMAR)</span>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">
            VARIABLES: ${r.grammar.variables.length} · START: ${r.grammar.startVariable}
          </span>
        </div>
        <div class="productions-grid">${e}</div>
      </section>

      <section class="grammar-panel">
        <div class="grammar-panel-header">
          <span class="grammar-panel-title">FORMAL GRAMMAR NOTATION</span>
        </div>
        <pre class="grammar-code-block">${x(n)}</pre>
      </section>

      <section class="grammar-panel">
        <div class="grammar-panel-header">
          <span class="grammar-panel-title">PARSED REGEX AST TREE</span>
        </div>
        <pre class="grammar-code-block">${x(t)}</pre>
      </section>
    </div>
  `}function Ot(){return`
    <div class="workspace-tabs-header">
      <nav class="tabs-nav">
        <button class="tab-btn ${r.activeTab==="automata"?"active":""}" data-tab="automata">
          <span class="tab-key-badge">1</span>
          <span>AUTOMATA GRAPH</span>
        </button>
        <button class="tab-btn ${r.activeTab==="stream"?"active":""}" data-tab="stream">
          <span class="tab-key-badge">2</span>
          <span>DATA STREAM</span>
          ${r.records.length>0?`<span class="badge">(${r.records.length})</span>`:""}
        </button>
        <button class="tab-btn ${r.activeTab==="grammar"?"active":""}" data-tab="grammar">
          <span class="tab-key-badge">3</span>
          <span>GRAMMAR & AST</span>
        </button>
        <button class="tab-btn ${r.activeTab==="guide"?"active":""}" data-tab="guide">
          <span class="tab-key-badge">4</span>
          <span>HOW TO INPUT</span>
        </button>
      </nav>
      <div class="tab-right-tools">
        <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">
          ENGINE: THOMPSON NFA
        </span>
      </div>
    </div>
  `}function Pt(){const t=[{token:"\\d",name:"Digit",desc:"Any digit from 0 to 9",example:"^\\d{6}$",sample:"940182"},{token:"\\w",name:"Word Character",desc:"Alphanumeric and underscore [A-Za-z0-9_]",example:"^usr_\\w{6}$",sample:"usr_a9k4z1"},{token:"\\s",name:"Whitespace",desc:"Space character",example:"^[A-Z]+\\s[A-Z]+$",sample:"ALICE SMITH"},{token:"[A-Z]",name:"Uppercase Set",desc:"Any uppercase letter A through Z",example:"^[A-Z]{3}$",sample:"LAX"},{token:"[a-z]",name:"Lowercase Set",desc:"Any lowercase letter a through z",example:"^[a-z]{5}$",sample:"swift"},{token:"[0-9A-F]",name:"Hexadecimal",desc:"Hex digits 0-9 and uppercase A-F",example:"^0x[0-9A-F]{4}$",sample:"0x4F1B"},{token:"[^0-9]",name:"Negated Class",desc:"Matches any non-digit character",example:"^[^0-9]{4}$",sample:"WXYZ"},{token:"{n}",name:"Exact Count",desc:"Matches preceding element exactly n times",example:"^[A-Z]{4}$",sample:"CODE"},{token:"{min,max}",name:"Range Count",desc:"Matches between min and max occurrences",example:"^[a-z]{3,6}$",sample:"python"},{token:"?",name:"Optional",desc:"Matches 0 or 1 occurrence",example:"^https?://api$",sample:"http://api"},{token:"*",name:"Zero or More",desc:"Unbounded loop (bounded by Max Repeat)",example:"^A[0-9]*Z$",sample:"A4819Z"},{token:"+",name:"One or More",desc:"1 or more occurrences (bounded by Max Repeat)",example:"^word-\\d+$",sample:"word-739"},{token:"(A|B)",name:"Alternation",desc:"Branch choice between two or more expressions",example:"^(USD|EUR|GBP)$",sample:"EUR"},{token:"\\.",name:"Escaped Literal",desc:"Matches literal dot (and other specials: \\-, \\_)",example:"^v\\d+\\.\\d+$",sample:"v2.1"}].map(s=>`
    <tr>
      <td><code>${x(s.token)}</code></td>
      <td><strong>${x(s.name)}</strong></td>
      <td>${x(s.desc)}</td>
      <td><code>${x(s.example)}</code> <span style="color:var(--ink-muted); margin-left:6px;">→ "${x(s.sample)}"</span></td>
      <td>
        <button class="btn-try-token" data-try-pattern="${x(s.example)}" title="Load '${x(s.example)}' into editor">
          Try Example
        </button>
      </td>
    </tr>
  `).join(""),e=W.map(s=>`
    <div class="template-card">
      <div class="template-header">
        <span class="template-title">${x(s.name)}</span>
        <span class="template-cat">${x(s.category)}</span>
      </div>
      <div class="template-pattern">/${x(s.pattern)}/</div>
      <button class="template-load-btn" data-try-pattern="${x(s.pattern)}">
        Load Pattern ↵
      </button>
    </div>
  `).join("");return`
    <div class="guide-tab-view">
      <!-- 1. Rules: How to Input -->
      <section class="guide-panel">
        <div class="guide-panel-header">
          <span class="guide-panel-title">1. HOW TO INPUT PATTERNS (SYNTAX RULES)</span>
          <span class="guide-panel-badge">CHOMSKY TYPE-3 REGULAR GRAMMAR</span>
        </div>
        <div class="guide-panel-body">
          <div class="guide-rule-grid">
            <div class="guide-rule-card">
              <div class="rule-icon">📐</div>
              <div class="rule-content">
                <strong>Always Use Anchors (^ and $)</strong>
                <p>Wrap expressions with <code>^</code> (start) and <code>$</code> (end), e.g. <code>^[A-Z]{3}-\\d{4}$</code>. This guarantees exact string bounds rather than open-ended substrings.</p>
              </div>
            </div>
            <div class="guide-rule-card">
              <div class="rule-icon">⚙️</div>
              <div class="rule-content">
                <strong>No Outer Slashes in Textarea</strong>
                <p>Type raw regex syntax directly. The workbench already renders the surrounding <code>/ ... /</code> delimiters visually in the editor.</p>
              </div>
            </div>
            <div class="guide-rule-card">
              <div class="rule-icon">🛡️</div>
              <div class="rule-content">
                <strong>Regular vs Non-Regular Syntax</strong>
                <p>GrammarMock strictly compiles to finite state automata. Literals, sets, ranges, alternations, and repetitions are 100% compliant. Lookaheads <code>(?=...)</code> and backreferences <code>\\1</code> are rejected as non-regular.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. What to Input: Cheatsheet -->
      <section class="guide-panel">
        <div class="guide-panel-header">
          <span class="guide-panel-title">2. WHAT TO INPUT (REGEX SYNTAX CHEATSHEET)</span>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">CLICK "TRY EXAMPLE" TO LOAD INTO EDITOR</span>
        </div>
        <div class="guide-panel-body" style="overflow-x: auto;">
          <table class="guide-syntax-table">
            <thead>
              <tr>
                <th>TOKEN</th>
                <th>NAME</th>
                <th>WHAT IT MATCHES</th>
                <th>EXAMPLE PATTERN</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              ${t}
            </tbody>
          </table>
        </div>
      </section>

      <!-- 3. What to Input for Parameters -->
      <section class="guide-panel">
        <div class="guide-panel-header">
          <span class="guide-panel-title">3. WHAT TO INPUT FOR PARAMETERS</span>
        </div>
        <div class="guide-panel-body">
          <div class="params-guide-grid">
            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>RECORD COUNT</span>
                <span class="param-guide-tag">1 - 10,000</span>
              </div>
              <div class="param-guide-desc">
                Specifies how many mock records to generate in a single batch. Use 10-25 for quick preview, or 1,000-10,000 for database seed exports.
              </div>
            </div>

            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>TRAVERSAL ENGINE</span>
                <span class="param-guide-tag">RANDOM / CHRONO</span>
              </div>
              <div class="param-guide-desc">
                <strong>Random Walk:</strong> Stochastic traversal through grammar branches. High entropy, varied mock data.<br/>
                <strong>Chronological (Shortlex):</strong> Exhaustive enumeration ordered by length, then alphabetical order (e.g. <code>AAA-0000</code>, <code>AAA-0001</code>).
              </div>
            </div>

            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>MAX REPEAT (* / +)</span>
                <span class="param-guide-tag">1 - 100 (DEF: 5)</span>
              </div>
              <div class="param-guide-desc">
                Bounds the repetition depth of unbounded quantifiers like <code>*</code>, <code>+</code>, and <code>{min,}</code> during generation. Prevents infinite looping in cyclic grammars.
              </div>
            </div>

            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>PRNG SEED</span>
                <span class="param-guide-tag">OPTIONAL INT</span>
              </div>
              <div class="param-guide-desc">
                Integer (e.g. <code>42</code> or <code>1001</code>). Using the same seed guarantees that GrammarMock reproduces the exact same sequence of records across multiple test runs.
              </div>
            </div>

            <div class="param-guide-card">
              <div class="param-guide-title">
                <span>EXPORT FORMAT</span>
                <span class="param-guide-tag">TXT / JSON / CSV / TS</span>
              </div>
              <div class="param-guide-desc">
                Choose the desired format for the Data Stream view: raw plain text lines, JSON array, CSV table, or a typed TypeScript string union.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Ready-to-Use Templates -->
      <section class="guide-panel">
        <div class="guide-panel-header">
          <span class="guide-panel-title">4. READY-TO-USE PATTERN TEMPLATES</span>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">1-CLICK LOAD INTO WORKBENCH</span>
        </div>
        <div class="guide-panel-body">
          <div class="templates-grid">
            ${e}
          </div>
        </div>
      </section>
    </div>
  `}function Dt(){return`
    <div id="shortcuts-modal" class="modal-backdrop ${r.showShortcuts?"open":""}">
      <div class="modal-dialog">
        <div class="modal-header">
          <span class="modal-title">KEYBOARD SHORTCUTS</span>
          <button id="close-modal-btn" class="icon-btn" style="border:none;">✕</button>
        </div>
        <div class="modal-body">
          <div class="shortcut-row">
            <span>Execute generation run</span>
            <div class="shortcut-keys"><span class="shortcut-key">Cmd / Ctrl</span><span class="shortcut-key">Enter</span></div>
          </div>
          <div class="shortcut-row">
            <span>Focus pattern editor</span>
            <div class="shortcut-keys"><span class="shortcut-key">/</span></div>
          </div>
          <div class="shortcut-row">
            <span>Switch to Automata Graph</span>
            <div class="shortcut-keys"><span class="shortcut-key">1</span></div>
          </div>
          <div class="shortcut-row">
            <span>Switch to Data Stream</span>
            <div class="shortcut-keys"><span class="shortcut-key">2</span></div>
          </div>
          <div class="shortcut-row">
            <span>Switch to Grammar & AST</span>
            <div class="shortcut-keys"><span class="shortcut-key">3</span></div>
          </div>
          <div class="shortcut-row">
            <span>Switch to How to Input Guide</span>
            <div class="shortcut-keys"><span class="shortcut-key">4</span></div>
          </div>
          <div class="shortcut-row">
            <span>Toggle shortcuts HUD</span>
            <div class="shortcut-keys"><span class="shortcut-key">?</span></div>
          </div>
        </div>
      </div>
    </div>
  `}function qt(){return`
    <div id="guide-modal" class="modal-backdrop ${r.showGuide?"open":""}">
      <div class="modal-dialog guide-dialog">
        <div class="modal-header">
          <span class="modal-title">📖 How to Use Data Generation</span>
          <button id="close-guide-btn" class="icon-btn" style="border:none;">✕</button>
        </div>
        <div class="modal-body guide-body">
          <div class="guide-section">
            <h4>1. Define or Select a Pattern</h4>
            <p>Type any standard regular expression in the left editor or choose an industry preset from the top dropdown (e.g. <code>Product SKU</code>, <code>Employee ID</code>, <code>UUID v4</code>, <code>SemVer</code>).</p>
            <div class="guide-callout">
              GrammarMock parses standard Type-3 regular expressions (literals, character classes <code>[a-z]</code>, ranges, shorthands <code>\\d</code>, <code>\\w</code>, <code>\\s</code>, quantifiers <code>*</code>, <code>+</code>, <code>?</code>, <code>{min,max}</code>, and alternation <code>(A|B)</code>).
            </div>
          </div>

          <div class="guide-section">
            <h4>2. Choose Generation Mode</h4>
            <ul>
              <li><strong>Random Walk:</strong> Generates stochastic mock records through probabilistic state transitions. Enter a <code>Seed</code> for 100% deterministic test fixtures.</li>
              <li><strong>Chronological:</strong> Enumerates strings in canonical <em>Shortlex</em> order (shortest strings first, followed by lexicographical order: <code>AAA-0000</code>, <code>AAA-0001</code>, <code>AAA-0002</code>...). Ideal for sequential identifiers.</li>
            </ul>
          </div>

          <div class="guide-section">
            <h4>3. Tune Parameters</h4>
            <ul>
              <li><strong>Count:</strong> Set the number of records to generate (1 to 10,000+).</li>
              <li><strong>Max Repeat:</strong> Sets the cycle-depth limit for unbounded quantifiers (<code>*</code> and <code>+</code>) to ensure finite strings.</li>
              <li><strong>PRNG Seed:</strong> Optional integer. Using the same seed reproduces the exact same records every time.</li>
            </ul>
          </div>

          <div class="guide-section">
            <h4>4. Generate & Export</h4>
            <p>Click <strong>GENERATE</strong> or press <code>Cmd/Ctrl + Enter</code>. In the <strong>Data Stream</strong> tab, you can search records, view entropy & length metrics, and export to <strong>TXT</strong>, <strong>JSON</strong>, <strong>CSV</strong>, or <strong>TypeScript</strong>.</p>
          </div>

          <div class="guide-section">
            <h4>5. Inspect Automata & Grammar</h4>
            <p>Switch tabs to explore the underlying formal models:</p>
            <ul>
              <li><strong>Automata Graph (Tab 1):</strong> Interactive Thompson NFA diagram with start/accept states, transition matrix, and step-by-step path tracer.</li>
              <li><strong>Grammar & AST (Tab 3):</strong> Formal Chomsky Right-Linear Grammar productions ($A \\to aB \\mid \\epsilon$) and parsed AST nodes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `}function w(){const n=r.activeTab==="automata"?It():r.activeTab==="stream"?Mt():r.activeTab==="grammar"?Nt():Pt();if(b.innerHTML=`
    <div class="workbench-shell">
      ${Rt()}
      <div class="workbench-body">
        ${Lt()}
        <main class="right-pane">
          ${Ot()}
          <div class="tab-content">${n}</div>
        </main>
      </div>
      <div id="toast-message" class="toast-msg" role="status"></div>
      ${Dt()}
      ${qt()}
    </div>
  `,Gt(),r.activeTab==="automata"){const t=b.querySelector("#automata-canvas-mount");t&&(j=new Et(t),r.nfa?j.setNFA(r.nfa):j.render())}}function Gt(){var l,p,g,f,S,y,$,u,d,T,E,C;(l=b.querySelector("#theme-btn"))==null||l.addEventListener("click",Tt),(p=b.querySelector("#guide-btn"))==null||p.addEventListener("click",()=>{r.showGuide=!0,w()}),(g=b.querySelector("#close-guide-btn"))==null||g.addEventListener("click",()=>{r.showGuide=!1,w()}),(f=b.querySelector("#guide-modal"))==null||f.addEventListener("click",m=>{m.target.id==="guide-modal"&&(r.showGuide=!1,w())}),(S=b.querySelector("#shortcuts-btn"))==null||S.addEventListener("click",()=>{r.showShortcuts=!0,w()}),(y=b.querySelector("#close-modal-btn"))==null||y.addEventListener("click",()=>{r.showShortcuts=!1,w()}),($=b.querySelector("#shortcuts-modal"))==null||$.addEventListener("click",m=>{m.target.id==="shortcuts-modal"&&(r.showShortcuts=!1,w())});const n=m=>{const v=b.querySelector(m);v&&v.addEventListener("change",()=>{const R=v.value;R&&(r.pattern=R,V(),Y())})};n("#header-preset-select"),n("#pane-preset-select"),b.querySelectorAll("[data-load-history]").forEach(m=>{m.addEventListener("click",()=>{const v=m.dataset.loadHistory;v&&(r.pattern=v,V(),w())})});const t=b.querySelector("#pattern-input");t&&t.addEventListener("input",()=>{r.pattern=t.value,V();const m=W.some(O=>O.pattern===r.pattern),v=b.querySelector("#header-preset-select"),R=b.querySelector("#pane-preset-select");v&&(v.value=m?r.pattern:""),R&&(R.value=m?r.pattern:"");const I=b.querySelector(".compile-status"),M=b.querySelector(".ast-stat");if(I&&M)if(r.error)I.className="compile-status error",I.innerHTML='<span class="status-dot"></span><span>SYNTAX ERROR</span>',M.textContent="CHECK EXPRESSION";else{I.className="compile-status valid",I.innerHTML='<span class="status-dot"></span><span>VALID GRAMMAR</span>';const O=r.nfa?r.nfa.getAllStates().length:0,H=r.grammar?r.grammar.productions.size:0;M.textContent=`${O} STATES · ${H} PRODUCTIONS`}r.activeTab==="automata"&&j&&r.nfa&&j.setNFA(r.nfa)});const e=b.querySelector("#count-input");e==null||e.addEventListener("change",()=>{r.count=Math.min(1e4,Math.max(1,Number(e.value)||10))});const s=b.querySelector("#mode-input");s==null||s.addEventListener("change",()=>{r.mode=s.value});const a=b.querySelector("#format-input");a==null||a.addEventListener("change",()=>{r.format=a.value});const i=b.querySelector("#repeat-input");i==null||i.addEventListener("change",()=>{r.maxRepeat=Math.min(100,Math.max(1,Number(i.value)||5))});const o=b.querySelector("#seed-input");o==null||o.addEventListener("input",()=>{r.seed=o.value}),(u=b.querySelector("#generate-btn"))==null||u.addEventListener("click",Y),b.querySelectorAll("[data-tab]").forEach(m=>{m.addEventListener("click",()=>{r.activeTab=m.dataset.tab,w()})}),(d=b.querySelector("#toggle-matrix-btn"))==null||d.addEventListener("click",()=>{r.showMatrix=!r.showMatrix,w()});const c=b.querySelector("#stream-search-input");c&&c.addEventListener("input",()=>{r.searchQuery=c.value,w();const m=b.querySelector("#stream-search-input");m&&(m.focus(),m.setSelectionRange(r.searchQuery.length,r.searchQuery.length))}),(T=b.querySelector("#copy-stream-btn"))==null||T.addEventListener("click",async()=>{try{const m=J(r.records,r.format);await navigator.clipboard.writeText(m),F("Copied records to clipboard")}catch{F("Clipboard unavailable")}}),(E=b.querySelector("#export-stream-btn"))==null||E.addEventListener("click",()=>{const m=J(r.records,r.format),v={text:"text/plain",json:"application/json",csv:"text/csv",ts:"text/typescript"},R={text:"txt",json:"json",csv:"csv",ts:"ts"},I=new Blob([m],{type:v[r.format]}),M=document.createElement("a");M.href=URL.createObjectURL(I),M.download=`grammarmock-records.${R[r.format]}`,M.click(),URL.revokeObjectURL(M.href),F("Download started")}),b.querySelectorAll(".token-chip[data-insert]").forEach(m=>{m.addEventListener("click",()=>{const v=m.dataset.insert;if(!v)return;let R=r.pattern;R.endsWith("$")?R=R.slice(0,-1)+v+"$":R=R+v,r.pattern=R,V(),Y(),F(`Inserted ${v}`)})}),(C=b.querySelector("#view-guide-tab-link"))==null||C.addEventListener("click",m=>{m.preventDefault(),r.activeTab="guide",w()}),b.querySelectorAll("[data-try-pattern]").forEach(m=>{m.addEventListener("click",()=>{const v=m.dataset.tryPattern;v&&(r.pattern=v,V(),Y(),F(`Loaded pattern: /${v}/`))})})}window.addEventListener("keydown",n=>{var e,s,a;if((n.metaKey||n.ctrlKey)&&n.key==="Enter"){n.preventDefault(),Y();return}const t=(e=document.activeElement)==null?void 0:e.tagName.toLowerCase();if(t==="input"||t==="textarea"||t==="select"){n.key==="Escape"&&((s=document.activeElement)==null||s.blur());return}n.key==="/"?(n.preventDefault(),(a=b.querySelector("#pattern-input"))==null||a.focus()):n.key==="1"?(r.activeTab="automata",w()):n.key==="2"?(r.activeTab="stream",w()):n.key==="3"?(r.activeTab="grammar",w()):n.key==="4"?(r.activeTab="guide",w()):n.key==="?"?(r.showShortcuts=!r.showShortcuts,w()):n.key==="Escape"&&(r.showShortcuts||r.showGuide)&&(r.showShortcuts=!1,r.showGuide=!1,w())});nt();V();Y();

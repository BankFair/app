(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[563],{7285:function(e,t,n){"use strict";var r;Object.defineProperty(t,"__esModule",{value:!0}),t.AmpStateContext=void 0;var a=((r=n(7294))&&r.__esModule?r:{default:r}).default.createContext({});t.AmpStateContext=a},9546:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isInAmpMode=s,t.useAmp=function(){return s(a.default.useContext(o.AmpStateContext))};var r,a=(r=n(7294))&&r.__esModule?r:{default:r},o=n(7285);function s(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.ampFirst,n=void 0!==t&&t,r=e.hybrid,a=void 0!==r&&r,o=e.hasQuery,s=void 0!==o&&o;return n||a&&s}},6505:function(e,t,n){"use strict";var r=n(930);function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}Object.defineProperty(t,"__esModule",{value:!0}),t.defaultHead=u,t.default=void 0;var o,s=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(7294)),i=(o=n(8252))&&o.__esModule?o:{default:o},d=n(7285),l=n(523),c=n(9546);n(7206);function u(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0],t=[s.default.createElement("meta",{charSet:"utf-8"})];return e||t.push(s.default.createElement("meta",{name:"viewport",content:"width=device-width"})),t}function p(e,t){return"string"===typeof t||"number"===typeof t?e:t.type===s.default.Fragment?e.concat(s.default.Children.toArray(t.props.children).reduce((function(e,t){return"string"===typeof t||"number"===typeof t?e:e.concat(t)}),[])):e.concat(t)}var f=["name","httpEquiv","charSet","itemProp"];function h(e,t){return e.reduce((function(e,t){var n=s.default.Children.toArray(t.props.children);return e.concat(n)}),[]).reduce(p,[]).reverse().concat(u(t.inAmpMode)).filter(function(){var e=new Set,t=new Set,n=new Set,r={};return function(a){var o=!0,s=!1;if(a.key&&"number"!==typeof a.key&&a.key.indexOf("$")>0){s=!0;var i=a.key.slice(a.key.indexOf("$")+1);e.has(i)?o=!1:e.add(i)}switch(a.type){case"title":case"base":t.has(a.type)?o=!1:t.add(a.type);break;case"meta":for(var d=0,l=f.length;d<l;d++){var c=f[d];if(a.props.hasOwnProperty(c))if("charSet"===c)n.has(c)?o=!1:n.add(c);else{var u=a.props[c],p=r[c]||new Set;"name"===c&&s||!p.has(u)?(p.add(u),r[c]=p):o=!1}}}return o}}()).reverse().map((function(e,n){var o=e.key||n;if(!t.inAmpMode&&"link"===e.type&&e.props.href&&["https://fonts.googleapis.com/css","https://use.typekit.net/"].some((function(t){return e.props.href.startsWith(t)}))){var i=function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}({},e.props||{});return i["data-href"]=i.href,i.href=void 0,i["data-optimized-fonts"]=!0,s.default.cloneElement(e,i)}return s.default.cloneElement(e,{key:o})}))}var m=function(e){var t=e.children,n=s.useContext(d.AmpStateContext),r=s.useContext(l.HeadManagerContext);return s.default.createElement(i.default,{reduceComponentsToState:h,headManager:r,inAmpMode:c.isInAmpMode(n)},t)};t.default=m},8252:function(e,t,n){"use strict";var r=n(7980),a=n(3227),o=n(8361),s=(n(2191),n(5971)),i=n(2715),d=n(1193);function l(e){var t=function(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var n,r=d(e);if(t){var a=d(this).constructor;n=Reflect.construct(r,arguments,a)}else n=r.apply(this,arguments);return i(this,n)}}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var c=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(7294));var u=function(e){s(n,e);var t=l(n);function n(e){var o;return a(this,n),(o=t.call(this,e)).emitChange=function(){o._hasHeadManager&&o.props.headManager.updateHead(o.props.reduceComponentsToState(r(o.props.headManager.mountedInstances),o.props))},o._hasHeadManager=o.props.headManager&&o.props.headManager.mountedInstances,o}return o(n,[{key:"componentDidMount",value:function(){this._hasHeadManager&&this.props.headManager.mountedInstances.add(this),this.emitChange()}},{key:"componentDidUpdate",value:function(){this.emitChange()}},{key:"componentWillUnmount",value:function(){this._hasHeadManager&&this.props.headManager.mountedInstances.delete(this),this.emitChange()}},{key:"render",value:function(){return null}}]),n}(c.Component);t.default=u},6042:function(e,t,n){"use strict";n.r(t);var r=n(6835),a=n(5988),o=n.n(a),s=n(2593),i=n(9008),d=n(7294),l=n(6594),c=n(9310),u=n(5462),p=n(2563),f=n(1838),h=n(5893),m=function(e){var t=e.address,n=(0,l.v9)((function(e){return e.pools[t]})),r=c.Q$.find((function(e){return e.address===t})),a=(null===r||void 0===r?void 0:r.name)||"",o=(null===r||void 0===r?void 0:r.managerName)||"",s=(null===r||void 0===r?void 0:r.tokenSymbol)||"",p=(null===r||void 0===r?void 0:r.uniswapUrl)||"",m=a?"".concat(a," - ").concat(c.iC):c.iC,v=(0,h.jsxs)(i.default,{children:[(0,h.jsx)("title",{children:m}),(0,h.jsx)("link",{rel:"icon",href:"".concat(c.O4,"/favicon.svg")})]}),w=(0,d.useState)(""),O=w[0],k=w[1],A=(0,c.mA)();return(0,d.useEffect)((function(){A?f.p$?(k(""),(0,c.qd)(A).then((function(e){k(e?A:"no")}))):k(A):k("no")}),[A]),n&&O?(0,h.jsxs)(u.T3,{children:[v,(0,h.jsx)(u.VB,{href:"/"}),(0,h.jsx)(u.EG,{poolAddress:t,name:a,managerName:o,tokenSymbol:s,uniswapUrl:p}),(0,h.jsx)(u.s6,{pool:n,poolAddress:t}),A&&O!==A?(0,h.jsx)(x,{children:(0,h.jsx)(y,{pool:n,poolAddress:t})}):(0,h.jsxs)(x,{children:[(0,h.jsx)(j,{pool:n,poolAddress:t}),(0,h.jsx)(b,{pool:n,poolAddress:t})]}),(0,h.jsx)(g,{pool:n,poolAddress:t})]}):(0,h.jsx)(u.SX,{children:v})};function x(e){var t=e.children;return(0,h.jsxs)("div",{className:"jsx-708391026",children:[(0,h.jsx)(o(),{id:"708391026",children:["div.jsx-708391026 h2{font-size:16px;margin:0 0 16px;}","div.jsx-708391026>.box{-webkit-flex-basis:50%;-ms-flex-preferred-size:50%;flex-basis:50%;}","div.jsx-708391026>.box>.stats>.stat{margin-top:8px;}","div.jsx-708391026>.box>.stats>.stat>.label{color:var(--color-secondary);margin-bottom:8px;font-size:16px;font-weight:400;}","div.jsx-708391026>.box>.stats>.stat>.value{color:var(--color);font-size:24px;font-weight:700;}","@media screen and (min-width:800px){div.jsx-708391026{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}div.jsx-708391026>:first-child{margin-right:8px;}div.jsx-708391026>:last-child{margin-left:8px;}div.jsx-708391026>:first-child:last-child{margin-left:0;margin-right:8px;}}","@media screen and (min-width:950px){div.jsx-708391026>.box>.stats{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}div.jsx-708391026>.box>.stats>.stat{-webkit-flex:1 1 0;-ms-flex:1 1 0;flex:1 1 0;}}"]}),t]})}m.getInitialProps=function(e){return{address:(0,c.Kn)(e.query.address)}},t.default=m;var v=(0,h.jsx)(u.gs,{size:19,text:"Snapshot of current return based APR of loans outstanding."});function y(e){var t=e.pool.managerAddress,n=e.poolAddress,a=(0,c.mA)(),o=(0,p.tJ)(n),s=(0,r.Z)(o,1)[0],i=t===a?"Manager can't deposit":void 0;return(0,h.jsxs)(u.xu,{overlay:i||null,children:[(0,h.jsx)("h2",{children:"Apply for access to lend (takes 1 min)"}),(0,h.jsx)("div",{className:"stats",children:(0,h.jsxs)("div",{className:"stat",children:[(0,h.jsxs)("div",{className:"label",children:["Estimated APY ",v]}),(0,h.jsx)("div",{className:"value",children:s?(0,c.T3)(s.apy/100):(0,h.jsx)(u.Od,{width:50})})]})}),(0,h.jsx)("div",{style:{marginBottom:8}}),(0,h.jsx)(u.zx,{href:"".concat(c.Kj===c.p5.mumbai?"https://plcw7zwnspa.typeform.com/to/OBHwt5ow":"https://plcw7zwnspa.typeform.com/to/trkCl5gk","#wallet_address=").concat(a),target:"_blank",style:{padding:"0 24px"},children:"Apply"}),(0,h.jsx)("div",{style:{marginBottom:16}}),(0,h.jsx)(u.bZ,{style:"warning",title:"This is an unaudited, size limited alpha proof of concept version. Please only add limited funds that you are prepared to lose. There is also limited liquidity to remove funds. Thank you for your support!"})]})}function j(e){var t=e.pool,n=t.managerAddress,a=t.liquidityTokenAddress,o=t.liquidityTokenDecimals,i=e.poolAddress,l=(0,c.mA)(),f=(0,p.tJ)(i),m=(0,r.Z)(f,2),x=m[0],y=m[1],j=(0,p.BP)(i,l),b=(0,r.Z)(j,2),g=b[0],w=b[1],O=(0,d.useMemo)((function(){if(!x)return{max:void 0,cannotDeposit:!1};var e=s.O$.from(x.amountDepositable),t=e.eq(c.bM);return{max:e,cannotDeposit:t}}),[x]),k=O.max,A=O.cannotDeposit,P=n===l,_=(0,u.nP)({type:"Deposit",onSumbit:function(e,t){return e.deposit(t)},refetch:function(){return Promise.all([w(),y()])},poolAddress:i,liquidityTokenAddress:a,liquidityTokenDecimals:o,disabled:Boolean(P||!x||A),max:k}),M=_.form,N=_.allowance,S=_.balance,C=P?"Manager can't deposit":A?"This pool doesn't accept deposits":void 0;return(0,h.jsxs)(u.xu,{loading:Boolean(!(!l||A)&&(!N||!S)||void 0===x),overlay:C?(0,h.jsxs)("div",{children:[C,g&&c.bM.lt(g.withdrawable)?(0,h.jsx)("div",{style:{textAlign:"center",marginTop:8},children:(0,h.jsx)(u.zx,{children:"Withdraw"})}):null]}):null,children:[(0,h.jsx)("h2",{children:"Add money"}),(0,h.jsx)("div",{className:"stats",children:(0,h.jsxs)("div",{className:"stat",children:[(0,h.jsxs)("div",{className:"label",children:["Estimated APY ",v]}),(0,h.jsx)("div",{className:"value",children:x?(0,c.T3)(x.apy/100):(0,h.jsx)(u.Od,{width:50})})]})}),M,(0,h.jsx)(u.bZ,{style:"warning",title:"You should not deposit unless you are prepared to sustain a total loss of the money you have invested plus any commission or other transaction charges"})]})}function b(e){var t=e.pool,n=t.managerAddress,a=t.liquidityTokenAddress,o=t.liquidityTokenDecimals,i=e.poolAddress,l=(0,c.mA)(),f=(0,p.tJ)(i),m=(0,r.Z)(f,2),x=m[0],v=m[1],y=(0,p.BP)(i,l),j=(0,r.Z)(y,2),b=j[0],g=j[1],w=(0,d.useMemo)((function(){return b?s.O$.from(b.withdrawable):void 0}),[b]),O=n===l,k=(0,u.nP)({type:"Withdraw",onSumbit:function(e,t){return e.withdraw(t)},refetch:function(){return Promise.all([g(),v()])},poolAddress:i,liquidityTokenAddress:a,liquidityTokenDecimals:o,disabled:Boolean(O||!x),max:w}),A=k.form,P=k.value;return(0,h.jsxs)(u.xu,{loading:Boolean(!!l&&!b),children:[(0,h.jsx)("h2",{children:"Your money"}),(0,h.jsxs)("div",{className:"stats",children:[(0,h.jsxs)("div",{className:"stat",children:[(0,h.jsxs)("div",{className:"label",children:["Balance"," ",(0,h.jsx)(u.gs,{size:19,text:"Your funds in the Pool including any interested earned. Note that interest earned is only shown when Borrowers make repayments. Generally, this number will rise once a month, not everyday."})]}),(0,h.jsx)("div",{className:"value",children:l?b?(0,c.xG)(b.balance,o):(0,h.jsx)(u.Od,{width:50}):"-"})]}),(0,h.jsxs)("div",{className:"stat",children:[(0,h.jsxs)("div",{className:"label",children:["Withdrawable"," ",(0,h.jsx)(u.gs,{size:19,text:"Funds that you can withdraw today. Dependant on how much un-loaned funds are in the pool at any one time."})]}),(0,h.jsx)("div",{className:"value",children:l?b?(0,c.xG)(b.withdrawable,o):(0,h.jsx)(u.Od,{width:50}):"-"})]})]}),A,(0,h.jsx)(u.$c,{value:P,verb:"withdrawing",feePercent:x?x.exitFeePercent:0})]})}function g(e){var t=e.pool.liquidityTokenDecimals,n=e.poolAddress,r=(0,d.useState)(!1),a=r[0],i=r[1],f=(0,d.useState)(null),m=f[0],x=f[1],v=(0,c.mA)(),y=(0,c.yL)(),j=(0,l.I0)();if((0,d.useEffect)((function(){v&&p.LJ.attach(n).protocolEarningsOf(v).then((function(e){e.gt(s.O$.from(0))&&x({amount:e,account:v})}))}),[v,n]),!m||!y)return null;var b=a?void 0:function(e){e.preventDefault(),i(!0),p.LJ.attach(n).connect(y.getSigner()).withdrawProtocolEarnings().then((function(e){return(0,p.y5)(j,{name:"Withdraw earnings",tx:e})})).then((function(){i(!1),x({account:v,amount:s.O$.from(0)})})).catch((function(e){console.error(e),i(!1)}))};return(0,h.jsxs)(u.xu,{children:[(0,h.jsx)(o(),{id:"1072476523",children:["h4.jsx-1072476523{margin-top:0;margin-bottom:10px;text-align:center;}","div.jsx-1072476523{text-align:center;margin-bottom:8px;}","form.jsx-1072476523>button{display:block;margin:0 auto;}"]}),(0,h.jsxs)("form",{onSubmit:b,className:"jsx-1072476523 section",children:[(0,h.jsx)("h4",{className:"jsx-1072476523",children:"Earnings"}),(0,h.jsxs)("div",{className:"jsx-1072476523",children:["Your earnings:"," ",m&&m.account===v&&(0,c.nx)(m.amount,t)," ",c.ob]}),(0,h.jsx)(u.zx,{type:"submit",loading:a,disabled:a||(null===m||void 0===m?void 0:m.amount.lte(s.O$.from(0))),children:"Withdraw"})]})]})}},5193:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/earn/[address]",function(){return n(6042)}])},9008:function(e,t,n){e.exports=n(6505)}},function(e){e.O(0,[774,888,179],(function(){return t=5193,e(e.s=t);var t}));var t=e.O();_N_E=t}]);
(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[563],{7285:function(e,t,n){"use strict";var r;Object.defineProperty(t,"__esModule",{value:!0}),t.AmpStateContext=void 0;var o=((r=n(7294))&&r.__esModule?r:{default:r}).default.createContext({});t.AmpStateContext=o},9546:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isInAmpMode=i,t.useAmp=function(){return i(o.default.useContext(a.AmpStateContext))};var r,o=(r=n(7294))&&r.__esModule?r:{default:r},a=n(7285);function i(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.ampFirst,n=void 0!==t&&t,r=e.hybrid,o=void 0!==r&&r,a=e.hasQuery,i=void 0!==a&&a;return n||o&&i}},6505:function(e,t,n){"use strict";var r=n(930);function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}Object.defineProperty(t,"__esModule",{value:!0}),t.defaultHead=d,t.default=void 0;var a,i=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(7294)),s=(a=n(8252))&&a.__esModule?a:{default:a},c=n(7285),u=n(523),l=n(9546);n(7206);function d(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0],t=[i.default.createElement("meta",{charSet:"utf-8"})];return e||t.push(i.default.createElement("meta",{name:"viewport",content:"width=device-width"})),t}function p(e,t){return"string"===typeof t||"number"===typeof t?e:t.type===i.default.Fragment?e.concat(i.default.Children.toArray(t.props.children).reduce((function(e,t){return"string"===typeof t||"number"===typeof t?e:e.concat(t)}),[])):e.concat(t)}var f=["name","httpEquiv","charSet","itemProp"];function h(e,t){return e.reduce((function(e,t){var n=i.default.Children.toArray(t.props.children);return e.concat(n)}),[]).reduce(p,[]).reverse().concat(d(t.inAmpMode)).filter(function(){var e=new Set,t=new Set,n=new Set,r={};return function(o){var a=!0,i=!1;if(o.key&&"number"!==typeof o.key&&o.key.indexOf("$")>0){i=!0;var s=o.key.slice(o.key.indexOf("$")+1);e.has(s)?a=!1:e.add(s)}switch(o.type){case"title":case"base":t.has(o.type)?a=!1:t.add(o.type);break;case"meta":for(var c=0,u=f.length;c<u;c++){var l=f[c];if(o.props.hasOwnProperty(l))if("charSet"===l)n.has(l)?a=!1:n.add(l);else{var d=o.props[l],p=r[l]||new Set;"name"===l&&i||!p.has(d)?(p.add(d),r[l]=p):a=!1}}}return a}}()).reverse().map((function(e,n){var a=e.key||n;if(!t.inAmpMode&&"link"===e.type&&e.props.href&&["https://fonts.googleapis.com/css","https://use.typekit.net/"].some((function(t){return e.props.href.startsWith(t)}))){var s=function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}({},e.props||{});return s["data-href"]=s.href,s.href=void 0,s["data-optimized-fonts"]=!0,i.default.cloneElement(e,s)}return i.default.cloneElement(e,{key:a})}))}var m=function(e){var t=e.children,n=i.useContext(c.AmpStateContext),r=i.useContext(u.HeadManagerContext);return i.default.createElement(s.default,{reduceComponentsToState:h,headManager:r,inAmpMode:l.isInAmpMode(n)},t)};t.default=m},8252:function(e,t,n){"use strict";var r=n(7980),o=n(3227),a=n(8361),i=(n(2191),n(5971)),s=n(2715),c=n(1193);function u(e){var t=function(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var n,r=c(e);if(t){var o=c(this).constructor;n=Reflect.construct(r,arguments,o)}else n=r.apply(this,arguments);return s(this,n)}}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var l=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(7294));var d=function(e){i(n,e);var t=u(n);function n(e){var a;return o(this,n),(a=t.call(this,e)).emitChange=function(){a._hasHeadManager&&a.props.headManager.updateHead(a.props.reduceComponentsToState(r(a.props.headManager.mountedInstances),a.props))},a._hasHeadManager=a.props.headManager&&a.props.headManager.mountedInstances,a}return a(n,[{key:"componentDidMount",value:function(){this._hasHeadManager&&this.props.headManager.mountedInstances.add(this),this.emitChange()}},{key:"componentDidUpdate",value:function(){this.emitChange()}},{key:"componentWillUnmount",value:function(){this._hasHeadManager&&this.props.headManager.mountedInstances.delete(this),this.emitChange()}},{key:"render",value:function(){return null}}]),n}(l.Component);t.default=d},6042:function(e,t,n){"use strict";n.r(t);var r=n(29),o=n(6835),a=n(5988),i=n.n(a),s=n(7794),c=n.n(s),u=n(1744),l=n(2593),d=n(9008),p=n(7294),f=n(6594),h=n(248),m=n(1353),x=n(5878),v=n(5893),b=function(e){var t,n=e.address,r=(0,f.v9)((function(e){return e.pools[n]})),o=null===(t=h.D.find((function(e){return e.address===n})))||void 0===t?void 0:t.name,a="".concat(o," - ").concat(h.iC),s=(0,v.jsxs)(d.default,{children:[(0,v.jsx)("title",{children:a}),(0,v.jsx)("meta",{name:"description",content:""}),(0,v.jsx)("link",{rel:"icon",href:"/favicon.ico"})]});return r?(0,v.jsxs)(m.T3,{children:[s,(0,v.jsx)(i(),{id:"1654377590",children:[".page>.section{max-width:300px;margin:10px auto;border:1px solid grey;border-radius:8px;text-align:center;padding:20px 0;}",".page>.section>h4{margin:0 0 10px;}",".page>.section table{margin:0 auto;}",".page>.section h3{text-align:center;}"]}),(0,v.jsx)("h1",{className:"jsx-1654377590",children:o}),(0,v.jsx)(m.s6,{pool:r,poolAddress:n}),(0,v.jsx)(g,{pool:r,poolAddress:n}),(0,v.jsx)(j,{pool:r,poolAddress:n}),(0,v.jsx)(y,{pool:r,poolAddress:n}),(0,v.jsx)(w,{pool:r,poolAddress:n}),(0,v.jsxs)("div",{className:"jsx-1654377590",children:["Pool address: ",(0,v.jsx)(m.GS,{address:n})]})]}):(0,v.jsx)(m.SX,{children:s})};function g(e){var t=e.pool,n=t.managerAddress,r=t.tokenAddress,a=t.tokenDecimals,s=e.poolAddress,c=(0,p.useState)(!1),d=c[0],f=c[1],b=(0,h.yL)(),g=(0,h.mA)(),j=(0,x.tQ)(r,s,g),y=j.allowance,w=j.balance,O=j.refetch,M=(0,p.useState)(!1),k=M[0],A=M[1];(0,p.useEffect)((function(){g&&A(!1)}),[g]);var _=(0,x.AM)(s),P=(0,o.Z)(_,2),S=P[0],C=P[1],D=(0,p.useMemo)((function(){if(!S)return{max:null,cannotDeposit:!0};var e=l.O$.from(S),t=e.eq(h.bM);if(!w)return{max:null,cannotDeposit:t};var n=l.O$.from(w);return{max:n.gt(e)?e:n,cannotDeposit:t}}),[S,w]),E=D.max,N=D.cannotDeposit,W=(0,p.useState)(""),$=W[0],z=W[1],B=(0,p.useMemo)((function(){var e=$?(0,u.vz)($,a):h.bM;return{value:null!==E&&void 0!==E&&E.lt(e)?(0,h.WU)((0,u.bM)(E,a)):$,needsApproval:!!y&&l.O$.from(y).lt(e)}}),[E,a,$,y]),I=B.value,L=B.needsApproval,U=(0,x.pB)(g?{poolAddress:s,account:g}:null),H=(0,p.useCallback)((function(){z((0,h.WU)((0,u.bM)(E,a)))}),[E,a]),T=n===g,J=Boolean(T||N||d);return(0,v.jsxs)(m.xu,{s:!0,loading:Boolean(!(!g||N)&&(!y||!w)||void 0===S),overlay:T?"Manager can't deposit":N?"This pool doesn't accept deposits":void 0,children:[(0,v.jsx)(i(),{id:"544869747",children:[".title.jsx-544869747>h3.jsx-544869747{margin:0;font-weight:400;font-size:18px;text-align:center;}","form.jsx-544869747{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;-webkit-align-items:center;-webkit-box-align:center;-ms-flex-align:center;align-items:center;margin:12px 0;}","form.jsx-544869747>.input-container.jsx-544869747{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;margin-bottom:8px;}","form.jsx-544869747>.input-container.jsx-544869747>.max.jsx-544869747{text-align:right;font-size:12px;height:14px;line-height:14px;margin-bottom:2px;margin-right:4px;}","form.jsx-544869747>.input-container.jsx-544869747>.max.jsx-544869747>span.jsx-544869747{cursor:pointer;}"]}),(0,v.jsx)("div",{className:"jsx-544869747 title",children:(0,v.jsx)("h3",{className:"jsx-544869747",children:"Deposit"})}),(0,v.jsxs)("form",{onSubmit:function(e){if(e.preventDefault(),g){var t=b.getSigner();if(L)return f(!0),void(0,h.lN)(r).connect(t).approve(s,h.PM).then((function(e){return e.wait()})).then((function(){return O()})).then((function(){f(!1)})).catch((function(e){console.error(e),f(!1)}));f(!0),x.LJ.attach(s).connect(t).deposit((0,u.vz)(I,a)).then((function(e){return e.wait()})).then((function(){return Promise.all([U(),O(),C()])})).then((function(){f(!1)})).catch((function(e){console.error(e),f(!1)}))}else A(!0)},className:"jsx-544869747",children:[(0,v.jsxs)("div",{className:"jsx-544869747 input-container",children:[(0,v.jsx)("div",{className:"jsx-544869747 max",children:E?(0,v.jsxs)("span",{onClick:H,className:"jsx-544869747",children:["Max: ",(0,h.WU)((0,u.bM)(E,a))]}):null}),(0,v.jsx)(m._Z,{decimals:6,disabled:J,value:I,onChange:z})]}),(0,v.jsx)(m.zx,{disabled:Boolean(J||!I&&g),type:"submit",width:170,loading:Boolean(d),children:g?L?"Approve USDC":"Deposit":"Connect Wallet"})]}),(0,v.jsx)(m.bZ,{style:"warning",title:"TODO: Explain the risks"}),k?(0,v.jsx)(m.Ot,{onClose:function(){return A(!1)}}):null]})}function j(e){var t=e.pool,n=(t.managerAddress,t.tokenAddress,t.tokenDecimals),r=e.poolAddress,o=(0,h.mA)();(0,x.pB)(o?{poolAddress:r,account:o}:null);var a=(0,f.v9)((function(e){var t;return o?null===(t=e.pools[r])||void 0===t?void 0:t.accountInfo[o]:null}));return o?(0,v.jsxs)(m.xu,{s:!0,children:[(0,v.jsxs)("div",{children:["Your deposit:"," ",a?"$".concat((0,h.WU)((0,u.bM)(a.balance,n))):(0,v.jsx)(m.Od,{width:35})]}),(0,v.jsxs)("div",{children:["Withdrawable:",a?"$".concat((0,h.WU)((0,u.bM)(a.withdrawable,n))):(0,v.jsx)(m.Od,{width:35})]})]}):null}function y(e){var t=e.pool,n=t.managerAddress,o=t.tokenDecimals,a=e.poolAddress,i=(0,p.useState)(!1),s=i[0],l=i[1],d=(0,p.useState)("100"),f=d[0],m=d[1],b=(0,x.q4)(a),g=(0,h.mA)(),j=(0,h.yL)(),y=n===g,w=(0,p.useState)("0"),O=w[0],M=w[1];(0,p.useEffect)((function(){g&&x.LJ.attach(a).amountWithdrawable(g).then((function(e){M((0,u.bM)(e,o))}))}),[M,g,o,b,O,a]);var k=!g||!j||y||s,A=k?void 0:function(e){e.preventDefault(),l(!0);var t=(0,u.vz)(f,o),n=x.LJ.attach(a);n.amountWithdrawable(g).then(function(){var e=(0,r.Z)(c().mark((function e(r){var a;return c().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!t.gt(r)){e.next=4;break}return alert("Maximum withdrawable amount is ".concat((0,u.bM)(r,o))),l(!1),e.abrupt("return");case 4:return e.next=6,n.connect(j.getSigner()).withdraw(t);case 6:return a=e.sent,e.next=9,a.wait();case 9:l(!1),M((0,u.bM)((0,u.vz)(O,o).sub(t),o));case 11:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}())};return(0,v.jsxs)("form",{className:"section",onSubmit:A,children:[(0,v.jsx)("h4",{children:"Withdraw"}),n&&g&&(y?(0,v.jsx)("div",{children:"Manager can not withdraw"}):(0,v.jsxs)("div",{children:["Maximum withdrawable:"," ",(0,v.jsx)("a",{onClick:function(){return m(O)},children:O})]})),(0,v.jsx)("input",{type:"number",inputMode:"decimal",onChange:function(e){m(e.target.value)},value:f}),(0,v.jsx)("button",{disabled:k,children:"Withdraw"})]})}function w(e){var t=e.pool.tokenDecimals,n=e.poolAddress,r=(0,p.useState)(!1),o=r[0],a=r[1],i=(0,p.useState)(null),s=i[0],c=i[1],d=(0,h.mA)(),f=(0,h.yL)();if((0,p.useEffect)((function(){d&&x.LJ.attach(n).protocolEarningsOf(d).then((function(e){e.gt(l.O$.from(0))&&c({amount:e,account:d})}))}),[d,c,n]),!s||!f)return null;var m=o?void 0:function(e){e.preventDefault(),a(!0),x.LJ.attach(n).connect(f.getSigner()).withdrawProtocolEarnings().then((function(e){return e.wait()})).then((function(){a(!1),c({account:d,amount:l.O$.from(0)})}))};return(0,v.jsxs)("form",{className:"section",onSubmit:m,children:[(0,v.jsx)("h4",{children:"Earnings"}),(0,v.jsxs)("div",{children:["Your earnings:"," ",s&&s.account===d&&(0,u.bM)(s.amount,t)]}),(0,v.jsx)("button",{disabled:o||(null===s||void 0===s?void 0:s.amount.lte(l.O$.from(0))),children:"Withdraw"})]})}b.getInitialProps=function(e){return{address:(0,h.Kn)(e.query.address)}},t.default=b},5193:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/earn/[address]",function(){return n(6042)}])},9008:function(e,t,n){e.exports=n(6505)}},function(e){e.O(0,[774,888,179],(function(){return t=5193,e(e.s=t);var t}));var t=e.O();_N_E=t}]);
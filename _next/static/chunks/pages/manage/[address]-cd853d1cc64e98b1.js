(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[634],{7285:function(e,t,n){"use strict";var r;Object.defineProperty(t,"__esModule",{value:!0}),t.AmpStateContext=void 0;var a=((r=n(7294))&&r.__esModule?r:{default:r}).default.createContext({});t.AmpStateContext=a},9546:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isInAmpMode=o,t.useAmp=function(){return o(a.default.useContext(s.AmpStateContext))};var r,a=(r=n(7294))&&r.__esModule?r:{default:r},s=n(7285);function o(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.ampFirst,n=void 0!==t&&t,r=e.hybrid,a=void 0!==r&&r,s=e.hasQuery,o=void 0!==s&&s;return n||a&&o}},6505:function(e,t,n){"use strict";var r=n(930);function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}Object.defineProperty(t,"__esModule",{value:!0}),t.defaultHead=d,t.default=void 0;var s,o=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(7294)),i=(s=n(8252))&&s.__esModule?s:{default:s},l=n(7285),c=n(523),u=n(9546);n(7206);function d(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0],t=[o.default.createElement("meta",{charSet:"utf-8"})];return e||t.push(o.default.createElement("meta",{name:"viewport",content:"width=device-width"})),t}function f(e,t){return"string"===typeof t||"number"===typeof t?e:t.type===o.default.Fragment?e.concat(o.default.Children.toArray(t.props.children).reduce((function(e,t){return"string"===typeof t||"number"===typeof t?e:e.concat(t)}),[])):e.concat(t)}var m=["name","httpEquiv","charSet","itemProp"];function p(e,t){return e.reduce((function(e,t){var n=o.default.Children.toArray(t.props.children);return e.concat(n)}),[]).reduce(f,[]).reverse().concat(d(t.inAmpMode)).filter(function(){var e=new Set,t=new Set,n=new Set,r={};return function(a){var s=!0,o=!1;if(a.key&&"number"!==typeof a.key&&a.key.indexOf("$")>0){o=!0;var i=a.key.slice(a.key.indexOf("$")+1);e.has(i)?s=!1:e.add(i)}switch(a.type){case"title":case"base":t.has(a.type)?s=!1:t.add(a.type);break;case"meta":for(var l=0,c=m.length;l<c;l++){var u=m[l];if(a.props.hasOwnProperty(u))if("charSet"===u)n.has(u)?s=!1:n.add(u);else{var d=a.props[u],f=r[u]||new Set;"name"===u&&o||!f.has(d)?(f.add(d),r[u]=f):s=!1}}}return s}}()).reverse().map((function(e,n){var s=e.key||n;if(!t.inAmpMode&&"link"===e.type&&e.props.href&&["https://fonts.googleapis.com/css","https://use.typekit.net/"].some((function(t){return e.props.href.startsWith(t)}))){var i=function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}({},e.props||{});return i["data-href"]=i.href,i.href=void 0,i["data-optimized-fonts"]=!0,o.default.cloneElement(e,i)}return o.default.cloneElement(e,{key:s})}))}var h=function(e){var t=e.children,n=o.useContext(l.AmpStateContext),r=o.useContext(c.HeadManagerContext);return o.default.createElement(i.default,{reduceComponentsToState:p,headManager:r,inAmpMode:u.isInAmpMode(n)},t)};t.default=h},8252:function(e,t,n){"use strict";var r=n(7980),a=n(3227),s=n(8361),o=(n(2191),n(5971)),i=n(2715),l=n(1193);function c(e){var t=function(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}();return function(){var n,r=l(e);if(t){var a=l(this).constructor;n=Reflect.construct(r,arguments,a)}else n=r.apply(this,arguments);return i(this,n)}}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var u=function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=Object.defineProperty&&Object.getOwnPropertyDescriptor?Object.getOwnPropertyDescriptor(e,n):{};r.get||r.set?Object.defineProperty(t,n,r):t[n]=e[n]}return t.default=e,t}(n(7294));var d=function(e){o(n,e);var t=c(n);function n(e){var s;return a(this,n),(s=t.call(this,e)).emitChange=function(){s._hasHeadManager&&s.props.headManager.updateHead(s.props.reduceComponentsToState(r(s.props.headManager.mountedInstances),s.props))},s._hasHeadManager=s.props.headManager&&s.props.headManager.mountedInstances,s}return s(n,[{key:"componentDidMount",value:function(){this._hasHeadManager&&this.props.headManager.mountedInstances.add(this),this.emitChange()}},{key:"componentDidUpdate",value:function(){this.emitChange()}},{key:"componentWillUnmount",value:function(){this._hasHeadManager&&this.props.headManager.mountedInstances.delete(this),this.emitChange()}},{key:"render",value:function(){return null}}]),n}(u.Component);t.default=d},9534:function(e,t,n){"use strict";n.r(t);var r=n(9499),a=n(6835),s=n(5988),o=n.n(s),i=n(2593),l=n(1744),c=n(9008),u=n(7294),d=n(5453),f=n(1101),m=n(2563),p=n(6594),h=n(5533),j=n(5893);function x(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function v(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?x(Object(n),!0).forEach((function(t){(0,r.Z)(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):x(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}var y="Earn - ".concat(d.iC),b=function(e){var t=e.address,n=(0,p.v9)((function(e){return e.pools[t]})),r=(0,d.mA)(),a=(0,j.jsxs)(c.default,{children:[(0,j.jsx)("title",{children:y}),(0,j.jsx)("link",{rel:"icon",href:"".concat(d.O4,"/favicon.svg")})]});return n?(0,j.jsxs)(f.T3,{children:[a,(0,j.jsx)(f.VB,{href:"/manage"}),(0,j.jsx)("h1",{children:n.name}),n?n.managerAddress===r?(0,j.jsxs)(j.Fragment,{children:[(0,j.jsx)(O,{pool:n,poolAddress:t}),(0,j.jsx)(w,{pool:n}),(0,j.jsx)(f.Ng,{pool:n,poolAddress:t})]}):(0,j.jsx)("h3",{children:"Login with manager wallet"}):(0,j.jsx)("h3",{children:"Loading\u2026"})]}):(0,j.jsx)(f.SX,{children:a})};b.getInitialProps=function(e){return{address:(0,d.Kn)(e.query.address)}},t.default=b;var g=["Stake","Unstake"];function O(e){var t=e.pool,n=t.managerAddress,r=t.liquidityTokenAddress,s=t.liquidityTokenDecimals,o=e.poolAddress,c=(0,u.useState)("Stake"),p=c[0],h=c[1],x=(0,d.mA)(),v=(0,m.tJ)(o),y=(0,a.Z)(v,1)[0],b=(0,m.DQ)(o),O=(0,a.Z)(b,2),w=O[0],P=O[1],k=(0,u.useMemo)((function(){if("Stake"!==p)return w?i.O$.from(w.unstakable):void 0}),[p,w]),_=n!==x,N=(0,f.nP)({type:p,onSumbit:"Stake"===p?function(e,t){return e.stake((0,l.parseUnits)(t,s))}:function(e,t){return e.unstake((0,l.parseUnits)(t,s))},refetch:function(){return Promise.all([P(),(0,m.IO)(o)])},poolAddress:o,liquidityTokenAddress:r,liquidityTokenDecimals:s,disabled:Boolean(_),max:k}),S=N.form,C=N.value;return(0,j.jsxs)(f.xu,{loading:Boolean(!("Unstake"!==p||!x)&&!w),overlay:_?"Only manager can stake":void 0,children:[(0,j.jsx)(f.mQ,{tabs:g,currentTab:p,setCurrentTab:h}),S,"Stake"===p?(0,j.jsx)(f.bZ,{style:"warning-filled",title:"You should not stake unless you are prepared to sustain a total loss of the money you have invested plus any commission or other transaction charges"}):(0,j.jsx)(f.$c,{value:C,verb:"unstaking",feePercent:y?y.exitFeePercent:0})]})}function w(e){var t=e.pool,n=t.loanDeskAddress,r=t.liquidityTokenDecimals,a=t.block,s=(0,p.I0)(),i=(0,d.yL)(),c=(0,u.useState)(null),x=c[0],y=c[1];(0,u.useEffect)((function(){var e=!1,t=m.Ed.attach(n).connect(i);return t.queryFilter(t.filters.LoanRequested(),a).then((function(n){if(console.log(n),e)return[];var r=(0,m.qm)(n.length,t).contract;return Promise.all(n.map((function(e){var t=e.data;return r.loanApplications(t)})))})).then((function(t){return e?[]:Promise.allSettled(t.filter((function(e){return e.status===m.WR.APPLIED})).map((function(e){return fetch("".concat(d.g9,"/profile/").concat(e.profileId)).then((function(e){return e.json()})).then((function(t){return v(v(v({},t),e),{},{id:e.id.toHexString()})}))})))})).then((function(t){e||y(t.filter((function(e){return"fulfilled"===e.status})).map((function(e){return e.value})))})).catch((function(e){console.error(e)})),function(){e=!0,y(null)}}),[a,n,i]);var b=(0,u.useState)(null),g=b[0],O=b[1];return(0,j.jsxs)(f.xu,{children:[(0,j.jsx)("h2",{className:o().dynamic([["161181199",[d.wP]]]),children:"Loans awaiting approval"}),(0,j.jsx)("div",{className:o().dynamic([["161181199",[d.wP]]])+" "+((null===x?void 0:"grid")||""),children:x?x.map((function(e){return(0,j.jsxs)(u.Fragment,{children:[(0,j.jsx)("div",{className:o().dynamic([["161181199",[d.wP]]])+" name",children:(0,j.jsx)("span",{onClick:function(){return O(e)},className:o().dynamic([["161181199",[d.wP]]]),children:e.name})}),(0,j.jsx)("div",{className:o().dynamic([["161181199",[d.wP]]])+" description",children:(0,j.jsxs)("span",{className:o().dynamic([["161181199",[d.wP]]]),children:[(0,l.formatUnits)(e.amount,r)," ",d.ob," for"," ",(0,f.DL)(e.duration.toNumber())," ","months"]})}),(0,j.jsx)("div",{className:o().dynamic([["161181199",[d.wP]]])+" address",children:(0,j.jsx)(f.s_,{address:e.borrower})})]},e.id)})):(0,j.jsx)("div",{className:o().dynamic([["161181199",[d.wP]]])+" loading",children:(0,j.jsx)(h.iT,{speed:.7,stroke:d.wP,width:32,height:32})})}),g?(0,j.jsx)(k,{loan:g,liquidityTokenDecimals:r,onClose:function(){return O(null)},onOffer:function(e,t,a,o,c,u){return m.Ed.attach(n).connect(i.getSigner()).offerLoan(g.id,e,t,u,a,o,c).then((function(t){return(0,m.y5)(s,{name:"Offer a loan for ".concat((0,l.formatUnits)(e,r)," ").concat(d.ob),tx:t})})).then((function(){O(null),y(x.filter((function(e){return e!==g})))})).catch((function(e){throw console.error(e),e}))},onReject:function(){return m.Ed.attach(n).connect(i.getSigner()).denyLoan(g.id).then((function(e){return(0,m.y5)(s,{name:"Reject loan",tx:e})})).then((function(){O(null),y(x.filter((function(e){return e!==g})))})).catch((function(e){throw console.error(e),e}))}}):null,(0,j.jsx)(o(),{id:"161181199",dynamic:[d.wP],children:["h2.__jsx-style-dynamic-selector{font-size:16px;margin-top:0;}",".loading.__jsx-style-dynamic-selector>svg{display:block;margin:10px auto 0;}",".grid.__jsx-style-dynamic-selector{display:grid;grid-template-columns:30% 50% 20%;}",".grid.__jsx-style-dynamic-selector>.name.__jsx-style-dynamic-selector>span.__jsx-style-dynamic-selector{color:".concat(d.wP,";cursor:pointer;}")]})]})}var P=35..toString();function k(e){var t=e.loan,n=e.onClose,r=e.liquidityTokenDecimals,a=e.onOffer,s=e.onReject,c=(0,u.useState)((0,l.formatUnits)(t.amount,r)),m=c[0],p=c[1],h=(0,u.useMemo)((function(){var e=t.duration.toNumber(),n=(0,f.DL)(e);return{initialMonths:n.toString(),initialInstallmentAmount:(0,l.formatUnits)((0,d.qJ)(t.amount,Math.trunc(Date.now()/1e3)-e,35).mul(100).div(Math.trunc(n)).div(100),r)}}),[r,t.amount,t.duration]),x=h.initialMonths,v=h.initialInstallmentAmount,y=(0,u.useState)(x),b=y[0],g=y[1],O=(0,u.useState)(v),w=O[0],k=O[1],_=(0,u.useState)(P),N=_[0],S=_[1],C=(0,u.useState)("35"),M=C[0],A=C[1],D=(0,u.useState)(!1),E=D[0],T=D[1],I=(0,u.useState)(!1),R=I[0],q=I[1],L=(0,u.useCallback)((function(e){e.preventDefault(),T(!0),a((0,l.parseUnits)(m,r),i.O$.from(Number(b)*d.L$),(0,l.parseUnits)(w,r),parseInt(b,10),10*Number(N),Number(M)*d.u3).catch((function(){T(!1)}))}),[m,b,M,w,N,r,a]),U=(0,u.useCallback)((function(){q(!0),s().catch((function(){q(!1)}))}),[s]);return(0,j.jsx)(f.u_,{onClose:n,children:(0,j.jsxs)("form",{onSubmit:L,className:"jsx-1787981640",children:[(0,j.jsx)("h3",{className:"jsx-1787981640",children:"Offer a Loan"}),(0,j.jsxs)("div",{className:"jsx-1787981640 field",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Account"}),(0,j.jsx)("div",{className:"jsx-1787981640",children:(0,j.jsx)(f.s_,{address:t.borrower})})]}),(0,j.jsxs)("div",{className:"jsx-1787981640 field",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Name"}),(0,j.jsx)("div",{className:"jsx-1787981640",children:t.name})]}),(0,j.jsxs)("div",{className:"jsx-1787981640 field",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Business Name"}),(0,j.jsx)("div",{className:"jsx-1787981640",children:t.businessName})]}),t.phone?(0,j.jsxs)("div",{className:"jsx-1787981640 field",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Phone"}),(0,j.jsx)("div",{className:"jsx-1787981640",children:(0,j.jsx)("a",{href:"tel:".concat(t.phone),className:"jsx-1787981640",children:t.phone})})]}):null,t.email?(0,j.jsxs)("div",{className:"jsx-1787981640 field",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Email"}),(0,j.jsx)("div",{className:"jsx-1787981640",children:(0,j.jsx)("a",{href:"mailto:".concat(t.email),className:"jsx-1787981640",children:t.email})})]}):null,(0,j.jsxs)("label",{className:"jsx-1787981640",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Amount"}),(0,j.jsx)(f._Z,{decimals:r,value:m,onChange:p})]}),(0,j.jsxs)("label",{className:"jsx-1787981640",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Duration"}),(0,j.jsx)(f._Z,{decimals:0,value:b,onChange:g,noToken:!0,label:"months",paddingRight:60})]}),(0,j.jsxs)("label",{className:"jsx-1787981640",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Interest p/a"}),(0,j.jsx)(f._Z,{decimals:1,value:N,onChange:S,noToken:!0,label:"%",paddingRight:26})]}),(0,j.jsxs)("label",{className:"jsx-1787981640",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Installment amount"}),(0,j.jsx)(f._Z,{decimals:r,value:w,onChange:k})]}),(0,j.jsxs)("label",{className:"jsx-1787981640",children:[(0,j.jsx)("div",{className:"jsx-1787981640 label",children:"Grace Default Period"}),(0,j.jsx)(f._Z,{decimals:2,value:M,onChange:A,noToken:!0,label:"days",paddingRight:44})]}),(0,j.jsxs)("div",{className:"jsx-1787981640 buttons",children:[(0,j.jsx)(f.zx,{disabled:E||R,loading:E,type:"submit",children:"Offer Loan"}),(0,j.jsx)(f.zx,{disabled:E||R,loading:R,onClick:U,type:"button",stone:!0,children:"Reject Application"})]}),(0,j.jsx)(o(),{id:"1787981640",children:["form.jsx-1787981640{padding:20px;}","form.jsx-1787981640>h3.jsx-1787981640{margin-top:0;}","form.jsx-1787981640>.field.jsx-1787981640,form.jsx-1787981640>label.jsx-1787981640{display:block;margin-top:16px;}","form.jsx-1787981640>.field.jsx-1787981640>.label.jsx-1787981640,form.jsx-1787981640>label.jsx-1787981640>.label.jsx-1787981640{color:var(--color-secondary);font-weight:400;margin-bottom:8px;}","form.jsx-1787981640>.buttons.jsx-1787981640{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}","form.jsx-1787981640>.buttons.jsx-1787981640>button{margin:16px 8px 0 0;}"]})]})})}},5243:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/manage/[address]",function(){return n(9534)}])},9008:function(e,t,n){e.exports=n(6505)}},function(e){e.O(0,[774,888,179],(function(){return t=5243,e(e.s=t);var t}));var t=e.O();_N_E=t}]);
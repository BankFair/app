(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[867],{7688:function(t,n,e){"use strict";e.r(n);var s=e(6371),i=e(9008),a=e(7294),l=e(9473),o=e(5453),c=e(1101),r=e(2563),u=e(5893),d="Earn - ".concat(o.iC),h=["Pool size","Manager funds","Avialable liquidity","Loans"];n.default=function(){var t=(0,o.mA)(),n=(0,r.Oh)(),e=Object.keys(n).length===o.D.length,f=(0,a.useMemo)((function(){return Object.values(n).filter((function(n){return n.managerAddress===t}))}),[n,t]),m=(0,l.I0)();(0,r.RD)(f.length?{dispatch:m,pools:f}:null);var j=(0,u.jsxs)(i.default,{children:[(0,u.jsx)("title",{children:d}),(0,u.jsx)("link",{rel:"icon",href:"".concat(o.O4,"/favicon.svg")})]});return t?e&&0===f.length?(0,u.jsx)("h3",{style:{textAlign:"center"},children:"You're not the manager of any pools"}):e?(0,u.jsxs)(c.T3,{children:[j,(0,u.jsx)("h1",{children:"Pools"}),(0,u.jsx)(c.At,{items:f.map((function(t){return{link:"/manage/".concat(t.address),name:t.name,stats:t.stats?["$".concat((0,o.ft)((0,s.formatUnits)(t.stats.poolFunds,t.liquidityTokenDecimals))),"$".concat((0,o.ft)((0,s.formatUnits)(t.stats.balanceStaked,t.liquidityTokenDecimals))),"$".concat((0,o.ft)((0,s.formatUnits)(t.stats.poolLiquidity,t.liquidityTokenDecimals))),t.stats.loans.toString()]:[(0,u.jsx)(c.Od,{width:50},"1"),(0,u.jsx)(c.Od,{width:50},"2"),(0,u.jsx)(c.Od,{width:50},"3"),(0,u.jsx)(c.Od,{width:30},"4")]}})),labels:h})]}):(0,u.jsx)(c.SX,{children:j}):(0,u.jsx)("h3",{style:{textAlign:"center"},children:"Connect your wallet to continue"})}},7790:function(t,n,e){(window.__NEXT_P=window.__NEXT_P||[]).push(["/manage",function(){return e(7688)}])}},function(t){t.O(0,[932,774,888,179],(function(){return n=7790,t(t.s=n);var n}));var n=t.O();_N_E=n}]);
%% ====================================================
%% object records
%% ====================================================

-record (object, {
  name,
  type,
  prop = dict:new(),
  castingDict
  }).

-record (classToMake, {
  name,
  inherit,
  prop,
  memoize
  }).

%% ====================================================
%% expression records
%% ====================================================

-record (exprLambda, {
  expr
}).

-record (exprApply, {
   left,
  right
}).

-record (exprFun, {
  type,
  name,
  function,
  bottom
}).

-record (exprVar, {
  index
}).


-record (exprCell, {
  name,
  pid,
  type,
  bottom
}).

%% ====================================================
%% cell records
%% ====================================================

-record(depender, {
  function,
  cell,
  id
}).

-record(func, {
  function,
  depender
}).

-record(dot, {
  num,
  value,
  lines
}).

%% ====================================================
%% pointer records
%% ====================================================
-record (funPointer, {
  name
}).

-record (objectPointer, {
  name
}).

-record (cellPointer, {
  name,
  pid
}).

%% ====================================================
%% gen_server records
%% ====================================================

-record (memoize, {
  ets = ets:new(memoizeTable, [])
}).

-record (serialize, {
  file,
  prepareState,
  variables
}).

% -record(cellState, {
%   funcs,
%   dots,
%   onRemoves=[],
%   dependencies=[],
%   funcColor=0,
%   intercept,
%   done=false
% }).
-record(scopeState, {
  dict,
  pointerCount
}).

-record(interceptState, {
  function,
  state,
  ownerCell
}).

%% ====================================================
%% session records
%% ====================================================

-record (session, {
  msgQueue = [],
  cleanup = [],
  lastMessageId = 0,
  queryIdCount = 0,
  clientState = satisfied,
  outputTimer,
  timeout = 300000,
  debug = 0
}).

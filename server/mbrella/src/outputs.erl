-module (outputs.erl).
-compile(export_all).

-include().

-ifdef( debug ).
-define( trace(X), io:format("TRACE ~p:~p ~p~n", [?MODULE, ?LINE, X]) ).
-else.
-define( trace(X), void ).
-endif.

%% ====================================================
%% TYPES
%% ====================================================


%% ====================================================
%% External API
%% ====================================================


%% ====================================================
%% Internal API
%% ====================================================


%% ====================================================
%% Utilities
%% ====================================================


const fs = require('fs');

// 1. Update homeSlice.ts
let homeSlice = fs.readFileSync('src/slices/homeSlice.ts', 'utf8');
if (!homeSlice.includes('futuresData: undefined')) {
    homeSlice = homeSlice.replace(
        /socket: undefined,\n/,
        "socket: undefined,\n  futuresData: undefined,\n"
    );
}
if (!homeSlice.includes('setFuturesData:')) {
    homeSlice = homeSlice.replace(
        /setFeeDetails: \(state, \{payload\}\) => \{\n      state\.feeDetails = payload;\n    \},/g,
        "setFeeDetails: (state, {payload}) => {\n      state.feeDetails = payload;\n    },\n    setFuturesData: (state, {payload}) => {\n      state.futuresData = payload;\n    },"
    );
}
fs.writeFileSync('src/slices/homeSlice.ts', homeSlice);

// 2. Update SocketProvider.js
let socketProvider = fs.readFileSync('src/SocketProvider.js', 'utf8');

// We leave futuresData in Context so we don't break ANY components that we might miss!
// We JUST add dispatch(setFuturesData(data)) so FuturesTrade can use Redux instead of Context!
// Wait! If futuresData is STILL in Context, then ANY component using SocketContext STILL re-renders 10x a second!
// To fix this, we MUST stop updating futuresData in Context!

if (socketProvider.includes('const [futuresData, setFuturesData] = useState(null);')) {
    // Replace state with a ref to avoid re-renders on Context consumers
    socketProvider = socketProvider.replace(
        /const \[futuresData, setFuturesData\] = useState\(null\);/g,
        "const futuresDataRef = useRef(null);"
    );
    // Replace contextValue dependency
    socketProvider = socketProvider.replace(
        /futuresData,/g,
        "futuresData: futuresDataRef.current,"
    );
    // Update the setFuturesData calls to update the ref AND dispatch
    socketProvider = socketProvider.replace(
        /setFuturesData\((.*?)\);/g,
        "futuresDataRef.current = $1;\n          dispatch(setFuturesData($1));"
    );
}
fs.writeFileSync('src/SocketProvider.js', socketProvider);
console.log('Fixed Redux and SocketProvider');

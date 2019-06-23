const express = require( 'express' );
const app = express();
const server = require( 'http' ).Server( app );
const io = require( 'socket.io' )( server );
const storage = require( 'node-persist' );



app.use( ( req, res, next ) => {
	res.io = io;
	next();
});

app.use( express.json() );
app.use( express.urlencoded( {extended: true} ) );

server.listen( 3030 );

app.get( '/', ( req, res ) => {
	res.send( 'Hello World' );
	res.io.emit( 'TEST', 'HI, testing' );
});

async function setScore( score ) {
	// Init storage
	await storage.init({
		dir: 'storage'
	});
	// Get all current scores in storage
	let theScores;
	let allScores = await storage.getItem( 'scores' );
	console.log( Array.isArray( allScores ) );
	// If it's empty, just set the storage to the current (our first score) otherwise add it on to the others
	if ( typeof allScores === "undefined" ) {
		theScores = [score];
		await storage.setItem( 'scores', theScores );
	} else {
		allScores.push( score );
		await storage.updateItem( 'scores', allScores );
	}
	// actually set it
}

async function setTeams( teams ) {
	// Init storage
	await storage.init({
		dir: 'storage'
	});
	await storage.setItem( 'teams', teams );
}

async function resetScores() {
	await storage.init({
		dir: 'storage'
	});
	await storage.clear();
}

// Want teamId, score
app.post( '/game-complete', ( req, res ) => {
	let score = {
		teamId: req.body.teamId,
		teamName: req.body.teamName,
		score: req.body.score
	};
	// Send a message to the dashboard
	res.io.emit( 'gameComplete', score );
	// Store the score locally
	setScore( score );
	//await setItem( 'scores', scores.push( { teamId: teamdId, score: score} ) );
	res.status( 200 ).json( { status: 'ok' } );
});

app.get( '/reset', ( req, res) => {
	resetScores();
	res.status( 200 ).json( { status: 'cleared' } );
});

// Socket Listeners

io.on( 'connection', function( socket ) {
	console.log( 'connection' );
	// Listen for team updates
	socket.on( 'updateTeams', function( teams ) {
		setTeams( teams );
	});
});
let express = require('express')
let bodyParser = require('body-parser')
let cors = require('cors')
let XLSX = require('xlsx')
let fileUpload = require('express-fileupload');

require('events').EventEmitter.defaultMaxListeners = Infinity;
let config = require('./config')

var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(cors())
app.use(fileUpload())
app.set('port', config.port)

app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', config.domain)
	res.setHeader('Access-Control-Allow-Methods', 'POST,GET')
	res.setHeader('Content-Type', 'application/json')
	next()
});

let routes = express.Router()

var transformExcel = () => (XLSX.readFile(config.excelRoute).Sheets.Lista_de_Precios_Base)

var guardarExcel = (x,y) => {
	if (!x.files) {
		return y.status(400).send('You did not select any files to charge.');
	}
	x.files.file.mv(config.excelRoute, function (err) {
		if (err) {
			return y.status(500).send(err);
		} else {
			let cont = 1, json = transformExcel(), params = {}, salida = []			
			Object.keys(json).map((x)=> {
				if(x!='!ref' && x!='!margins') {
					if (cont==1) {
						params.codigo = json[x].v
						cont++
					} else if (cont==2) {
						params.sku = json[x].v
						cont++
					} else if (cont==3) {
						params.descripcion = json[x].v
						cont++
					} else if (cont==4) {
						params.valor = json[x].v
						salida.push(params)
						params = {}
						cont = 1
					}
				}
			});
			return y.status(200).json({ ok: true });
		}
	})
}

routes.get('/', function(req, res) {
	res.send({
		'Mensaje': 'Welcome to the API REST!'
	})
})

routes.post('/SaveExcel/', (req, res) => {
	guardarExcel(req, res)
})

app.use(routes)

app.listen(config.port, () =>	console.log(`Exec on http://localhost:${config.port}`))
const axios = require('axios');
const client = require('./configs/dbconfig');

async function importCities(request, path, districtName, cities, districtsMap) {
  for (const city of cities) {
    const code = city.codigoine || city.id;
    const cityName = city.nome;

    const districtId = districtsMap.get(districtName);

    if (districtId) {
      const cityQuery = 'SELECT id FROM city WHERE name = $1 AND "districtId" = $2';
      const cityResult = await client.query(cityQuery, [cityName, districtId]);

      if (cityResult.rows.length === 0) {
        const insertQuery = 'INSERT INTO city (name, code, "districtId") VALUES ($1, $2, $3)';
        const insertValues = [cityName, code, districtId];

        console.log('SQL:', insertQuery);
        console.log('Values:', insertValues);
        await client.query(insertQuery, insertValues);
      }
    } else {
      console.error(`District not found for name: ${districtName}`);
    }
  }
}

(async () => {
  /**
  * @type {import('axios').AxiosInstance}
  */
  try {
    // Importando cidades do Brasil
    const requestBrasil = axios.create({
      baseURL: process.env.BASE_URL_BRASIL
    });

    const statesBrasil = new Map([
      ['Acre', 'AC'],
      ['Alagoas', 'AL'],
      ['Amapá', 'AP'],
      ['Amazonas', 'AM'],
      ['Bahia', 'BA'],
      ['Ceará', 'CE'],
      ['Distrito Federal', 'DF'],
      ['Espírito Santo', 'ES'],
      ['Goiás', 'GO'],
      ['Maranhão', 'MA'],
      ['Mato Grosso', 'MT'],
      ['Mato Grosso do Sul', 'MS'],
      ['Minas Gerais', 'MG'],
      ['Pará', 'PA'],
      ['Paraíba', 'PB'],
      ['Paraná', 'PR'],
      ['Pernambuco', 'PE'],
      ['Piauí', 'PI'],
      ['Rio de Janeiro', 'RJ'],
      ['Rio Grande do Norte', 'RN'],
      ['Rio Grande do Sul', 'RS'],
      ['Rondônia', 'RO'],
      ['Roraima', 'RR'],
      ['Santa Catarina', 'SC'],
      ['São Paulo', 'SP'],
      ['Sergipe', 'SE'],
      ['Tocantins', 'TO'],
    ]);

    // Buscar todos os distritos do Brasil
    const districtQueryBrasil = 'SELECT id, name FROM district WHERE "countryId" = (SELECT id FROM country WHERE name = $1)';
    const districtResultBrasil = await client.query(districtQueryBrasil, ['Brasil']);
    const districtsMapBrasil = new Map(districtResultBrasil.rows.map(row => [row.name, row.id]));

    for (const [name, abbrv] of statesBrasil.entries()) {
      const path = `/${abbrv}/municipios`;
      const { data: cities } = await requestBrasil.get(path);
      await importCities(requestBrasil, path, name, cities, districtsMapBrasil);
    }

    console.log('Import from Brazil cities completed successfully.');

    // Importando cidades de Portugal
    const requestPortugal = axios.create({
      baseURL: process.env.BASE_URL_PORTUGAL,
    });

    const pathPortugal = '/distritos/municipios';
    const { data: districts } = await requestPortugal.get(pathPortugal);

    // Buscar todos os distritos de Portugal
    const districtQueryPortugal = 'SELECT id, name FROM district WHERE "countryId" = (SELECT id FROM country WHERE name = $1)';
    const districtResultPortugal = await client.query(districtQueryPortugal, ['Portugal']);
    const districtsMapPortugal = new Map(districtResultPortugal.rows.map(row => [row.name, row.id]));

    for (const district of districts) {
      const districtName = district.distrito;
      const cities = district.municipios;
      await importCities(requestPortugal, pathPortugal, districtName, cities, districtsMapPortugal);
    }

    console.log('Import from Portugal cities completed successfully.');
  } catch (error) {
    console.error('Error during import:', error, error);
  } finally {
    await client.end();
  }
})();

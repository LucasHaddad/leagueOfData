import { LolApi } from 'twisted'

const api = new LolApi()
const mainSummoner = process.argv[2]
const mainRegion = process.argv[3]
const coleagueSummoner = process.argv[4]

const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms))

const summonerByName = (summoner, region) => (
    api.Summoner.getByName(summoner, region)
)

const matchByAccountId = (accountId, region) => (
    api.Match.list(accountId, region, { queue: 420, endIndex: 30 })
)

const matchesDetails = async (matchesIds = [], region) => {
    const games = []
    while (games.length < matchesIds.length) {
        const end = matchesIds.length - games.length
        const begin = end - 10 > 0 ? end - 10 : 0
        games.push(await Promise.all(matchesIds.slice(begin, end)
            .map(async matchId => await api.Match.get(matchId, region))))
        await sleep(900)
    }
    return games.flat()
}

const countValueOnProperty = (value, property, data) => (
    data.reduce((previous, current) => current[property] === value ? ++previous : previous, 0)
)

const getNumberOfTimesSummonersHaveMatch = async (summoner, matches) => {
    const participants = matches.map(game => game.response.participantIdentities
        .map(participant => participant.player)).flat()
    return countValueOnProperty(summoner, 'summonerName', participants)
}

const getSummonersStatistics = async (summonerA, summonerB, region) => {
    const first = await summonerByName(summonerA, region)
    const second = await summonerByName(summonerB, region)
    const summoner = second.response.name
    const matches = await matchByAccountId(first.response.accountId, region)
    const games = matches.response.matches.map(match => match.gameId)
    const gamesDetails = await matchesDetails(games, region)
    const all = await getNumberOfTimesSummonersHaveMatch(summoner, gamesDetails)
    console.log(all)
}

getSummonersStatistics(mainSummoner, coleagueSummoner, mainRegion)
import { FastifyReply, FastifyRequest } from 'fastify'
import { dataSource } from '../models'

interface IGetStatisticsQuery {
    categoryIds: string
    fromPeriod: string
    toPeriod: string
}

async function getStatistics(req: FastifyRequest<{ Querystring: IGetStatisticsQuery }>, reply: FastifyReply) {
    const categoryIds = req.query.categoryIds?.split(',')?.map((str) => parseInt(str))

    if (!categoryIds) {
        return reply.status(400).send({ message: 'Wrong categoryIds query value', statusCode: 400 })
    }

    const { fromPeriod, toPeriod } = req.query

    const rawStatistics = await dataSource.query(
        `SELECT name AS category, SUM(amount) AS amount FROM transaction_categories
        LEFT JOIN categories ON categories.id = category_id
        WHERE category_id IN (
            ${categoryIds.join(',')}
        ) AND transaction_id IN (
            SELECT id FROM transactions WHERE timestamp > $1 AND timestamp < $2
        ) GROUP BY categories.name`,
        [fromPeriod, toPeriod]
    )

    const statistics: {
        [key: string]: number
    } = {}

    for (const row of rawStatistics) {
        statistics[row.category] = row.amount
    }

    reply.send(statistics)
}

export const statisticsControllers = {
    getStatistics
}

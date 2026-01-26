// Конфигурация бота
export default {
    // ID владельца бота (из переменной окружения)
    owner: process.env.BOT_OWNER_ID ? parseInt(process.env.BOT_OWNER_ID) : null,

    // ID администраторов бота
    admins: process.env.BOT_ADMINS 
        ? process.env.BOT_ADMINS.split(',').map(id => parseInt(id.trim()))
        : [],

    // Уровни доступа
    permissions: {
        EVERYONE: 0,
        ADMIN: 1,
        OWNER: 2
    }
};

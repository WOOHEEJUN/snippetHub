const getBadgeImagePath = (badgeName) => {
    if (!badgeName) return '';
    return `/badges/${badgeName}.png`;
};

const getLevelBadgeImage = (level) => {
    if (!level) return '';
    const levelImageMap = {
        BRONZE: 'bronze.png',
        SILVER: 'silver.png',
        GOLD: 'gold.png',
        PLATINUM: 'platinum.png',
        DIAMOND: 'diamond.png',
        MASTER: 'master.png',
        GRANDMASTER: 'grandmaster.png',
        LEGEND: 'legend.png',
    };
    const imageName = levelImageMap[level.toUpperCase()];
    if (!imageName) return '';
    return `/badges/${imageName}`;
};

export { getBadgeImagePath, getLevelBadgeImage };

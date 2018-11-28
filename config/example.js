module.exports = {
  serviceBus: {
    topicCreate_DefaultValues: {
      EnablePartitioning: false,
      MaxSizeInMegabytes: 1024, // default
      RequiresDuplicateDetection: false, // default,
      DuplicateDetectionHistoryTimeWindow: 'PT10M',
      DefaultMessageTimeToLive: 'P10675199DT2H48M5.4775807S',
      SupportOrdering: true, // default,
      X_MaxSubscriptionsPerTopic: 1,
      X_MaxSqlFiltersPerTopic: 1,
      X_MaxCorrelationFiltersPerTopic: 1,
    },
    topicCreate_Template: {
      EnablePartitioning: false,
    },
    topics: {
      'topic-1': {
      },
    },
    publications: {
      sendEmail: {
        topic: 'topic-1',
      },
    },
  },
};

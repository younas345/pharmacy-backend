export const optimizationSchemas = {
  AlternativeDistributor: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'ABC Reverse Distributors',
      },
      price: {
        type: 'number',
        example: 0.855,
      },
      difference: {
        type: 'number',
        example: -0.065,
        description: 'Price difference from recommended distributor (negative means cheaper)',
      },
      available: {
        type: 'boolean',
        example: true,
        description: 'Whether this distributor has recent data (within last 30 days)',
      },
    },
  },
  OptimizationRecommendation: {
    type: 'object',
    properties: {
      ndc: {
        type: 'string',
        example: '00093-2263-01',
      },
      productName: {
        type: 'string',
        example: 'Amoxicillin 500mg Capsule',
      },
      quantity: {
        type: 'number',
        example: 13,
        description: 'Quantity of the product in the pharmacy list',
      },
      recommendedDistributor: {
        type: 'string',
        example: 'XYZ Pharmaceutical Returns',
      },
      expectedPrice: {
        type: 'number',
        example: 0.92,
        description: 'Best price per unit from recommended distributor',
      },
      worstPrice: {
        type: 'number',
        example: 0.855,
        description: 'Worst (lowest) price per unit among all distributors',
      },
      available: {
        type: 'boolean',
        example: true,
        description: 'Whether the recommended distributor has recent data (within last 30 days)',
      },
      alternativeDistributors: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/AlternativeDistributor',
        },
      },
      savings: {
        type: 'number',
        example: 13.75,
        description: 'Potential savings by using recommended distributor',
      },
    },
  },
  OptimizationResponse: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        example: 'success',
      },
      data: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OptimizationRecommendation',
            },
          },
          totalPotentialSavings: {
            type: 'number',
            example: 18.75,
            description: 'Total potential savings across all recommendations',
          },
          generatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-02-15T10:00:00Z',
          },
          distributorUsage: {
            type: 'object',
            properties: {
              usedThisMonth: {
                type: 'number',
                example: 2,
                description: 'Number of distributors used this month',
              },
              totalDistributors: {
                type: 'number',
                example: 5,
                description: 'Total number of active distributors',
              },
              stillAvailable: {
                type: 'number',
                example: 3,
                description: 'Number of distributors still available this month',
              },
            },
          },
          earningsComparison: {
            type: 'object',
            properties: {
              singleDistributorStrategy: {
                type: 'number',
                example: 80.32,
                description: 'Earnings using only the best recommended distributor',
              },
              multipleDistributorsStrategy: {
                type: 'number',
                example: 108.43,
                description: 'Earnings using all available distributors this month',
              },
              potentialAdditionalEarnings: {
                type: 'number',
                example: 28.11,
                description: 'Potential additional earnings by using multiple distributors',
              },
            },
          },
        },
      },
    },
  },
};


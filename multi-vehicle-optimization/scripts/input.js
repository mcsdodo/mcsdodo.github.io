const optimizationInput = {
    "locations": [{
            "location_id": "depot",
            "coordinates": "48.212870,17.174013"
        },
        {
            "location_id": "customer01",
            "coordinates": "48.14713,17.0843",
            "availability": {
                "earliest_start": "2017-03-02T08:00:00",
                "latest_end": "2017-03-02T08:30:00"
            }
        },
        {
            "location_id": "customer02",
            "coordinates": "48.15349,17.08556",
            "availability": {
                "earliest_start": "2017-03-02T08:00:00",
                "latest_end": "2017-03-02T08:30:00"
            }
        },
        {
            "location_id": "customer03",
            "coordinates": "48.14932,17.21944",
            "availability": {
                "earliest_start": "2017-03-02T08:00:00",
                "latest_end": "2017-03-02T18:00:00"
            }
        },
        {
            "location_id": "customer04",
            "coordinates": "48.16555,17.13828",
            "availability": {
                "earliest_start": "2017-03-02T08:00:00",
                "latest_end": "2017-03-02T18:00:00"
            }
        },
        {
            "location_id": "customer05",
            "coordinates": "48.15032,17.15797",
            "availability": {
                "earliest_start": "2017-03-02T09:45:00",
                "latest_end": "2017-03-02T18:00:00"
            }
        }
    ],
    "vehicles": [{
            "vehicle_id": "vehicle1",
            "cost_per_km": 1,
            "cost_per_hour": 0,
            "start_location_id": "depot",
            "end_location_id": "depot",
            "max_capacity": [
                5
            ],
            "availability": {
                "earliest_start": "2017-03-02T08:00:00",
                "latest_end": "2017-03-02T18:00:00"
            }
        },
        {
            "vehicle_id": "vehicle2",
            "cost_per_km": 10,
            "cost_per_hour": 0,
            "start_location_id": "depot",
            "end_location_id": "depot",
            "max_capacity": [
                2
            ],
            "availability": {
                "earliest_start": "2017-03-02T08:00:00",
                "latest_end": "2017-03-02T18:00:00"
            }
        },
        {
            "vehicle_id": "vehicle3",
            "cost_per_km": 100,
            "cost_per_hour": 0,
            "start_location_id": "depot",
            "end_location_id": "depot",
            "max_capacity": [
                2
            ],
            "availability": {
                "earliest_start": "2017-03-02T08:00:00",
                "latest_end": "2017-03-02T18:00:00"
            }
        }
    ],
    "tasks": [{
            "task_id": "task01",
            "capacity": [
                2
            ],
            "activities": [{
                    "activity_type": "pickup",
                    "location_id": "depot"
                },
                {
                    "activity_type": "delivery",
                    "location_id": "customer01",
                    "service_time": "00:00:00"
                }
            ]
        },
        {
            "task_id": "task02",
            "priority": "critical",
            "compatible_vehicles": [
                "vehicle2"
            ],
            "capacity": [
                1
            ],
            "activities": [{
                    "activity_type": "pickup",
                    "location_id": "depot"
                },
                {
                    "activity_type": "delivery",
                    "location_id": "customer02"
                }
            ]
        },
        {
            "task_id": "task03",
            "compatible_vehicles": [
                "vehicle2",
                "vehicle3"
            ],
            "capacity": [
                1
            ],
            "activities": [{
                    "activity_type": "pickup",
                    "location_id": "depot"
                },
                {
                    "activity_type": "delivery",
                    "location_id": "customer03"
                }
            ]
        },
        {
            "task_id": "task04",
            "compatible_vehicles": [
                "vehicle3"
            ],
            "capacity": [
                1
            ],
            "activities": [{
                    "activity_type": "pickup",
                    "location_id": "depot"
                },
                {
                    "activity_type": "delivery",
                    "location_id": "customer04",
                    "service_time": "00:00:00"
                }
            ]
        },
        {
            "task_id": "task05",
            "capacity": [
                1
            ],
            "activities": [{
                    "activity_type": "pickup",
                    "location_id": "depot"
                },
                {
                    "activity_type": "delivery",
                    "location_id": "customer05"
                }
            ]
        }
    ]
};
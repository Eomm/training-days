# Application Observability Demo

In order to achieve the Grafana Observability Solution Architect accreditation, you need to record a demo video to include the following:

## Overview - About Grafana

Grafana is a powerful, open-source web application designed for interactive visualization and data correlation across multiple platforms.
It seamlessly integrates with a wide set of data sources, including Prometheus, InfluxDB, Elasticsearch, and more, allowing you to query, visualize, alert on, and gain insights from your metrics regardless of where they are stored.

Grafana empowers you to create, explore, and share dynamic dashboards with your team, fostering a data-driven culture. By breaking down silos and enabling faster, informed decision-making, it enhances collaboration and improves operational efficiency.

It creates a single pane of glass to monitor your infrastructure, applications, and business metrics and react proactively to events that may impact your business.

While Grafana solves the visualization problem, there are other components that are needed to achieve full observability:

- Prometheus or Mimir: to collect metrics
- Loki or Elasticseach: to collect logs
- Tempo or Jaeger: to collect traces

All these components are open source and can be installed on your own infrastructure to get started with observability in your environment.

## Observability Challenges

Installing and maintaining a monitoring system is a complex task that requires a lot of effort and resources. As mentioned before, we need to start different components to achieve full observability, such as Prometheus, Loki, and Tempo but this is the tip of the iceberg.
Sooner or later, the following challenges will arise:

- Scalability: as the number of metrics, logs, and traces grow, the monitoring system needs to scale to handle the increased load or it will impact negatively on the next challenge:
- Reliability: the reliability of the system may decrease, making it harder to keep the system running smoothly causing blind spots in the monitoring system when it is needed the most such as during a peak load or an incident.
- Performance: the system may slow down increasing the time to resolution, making it harder to react proactively
- Security and Compliance: the default settings of the monitoring system may not be secure enough to meet the security and compliance requirements of the organization such as multi-tenancy, access control and data retention policies.
- Cost: the cost of maintaining a big monitoring system may increase over time, making it harder to justify the investment.

Grafaba Labs has created a platform to solve all these challenges and provide a fully managed observability solution that is easy to use, scalable, and cost-effective.

Grafana Cloud is an out-of-the box solution to monitor applications and minimize MTTR (mean time to resolution). It is a composable observability platform that enables you to observe, alert, and notify on all of your metrics, logs, and traces in one unified experience.

It does not fear the scale of your data, and it can be used to monitor highly dynamic environments. As reference: one of the biggest Loki instance ingest 650 TB of logs per hour.

You will not be distracted by the complexity of the underlying systems so you will be able to focus on what matters most to you.

Grafana Labs is the leading company behind all the OSS used in Grafana Cloud. It leads the development of Grafana, Loki, and Tempo, and it employs the maintainers of Prometheus, so it can provide the best knowledge and support for these tools to our customers.

It is worth to mention its pricing model too. It is based on pay per use, but it includes the Grafana's Adaptive Metrics feature detect and reduce unused metrics, which reduces the cost of your bill!

## Grafana's Open and Composable Observability Stack

NA.

## Grafana Product Demo

I talked a lot, but someones once said "talk is cheap, show me the code".
So let's what does it look like to use an observability platform like Grafana Cloud.

TODO

## Conclusion

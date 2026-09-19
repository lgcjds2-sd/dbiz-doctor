-- D-Biz Doctor Seed Data
-- schema.sql 실행 후 이 파일을 실행하세요.

-- ============================================================
-- 1. 진단영역 (9개)
-- ============================================================

INSERT INTO categories (code, name, description, display_order) VALUES
('ST', '전략·목표', '전략 방향, 목표 정렬, 자원배분 및 전략 피드백 체계를 진단합니다.', 1),
('CM', '고객·시장', '고객 이해, 시장 변화 감지 및 대응체계를 진단합니다.', 2),
('MS', '마케팅·영업', '고객획득, 유지, 매출성장 및 마케팅 성과관리 구조를 진단합니다.', 3),
('PS', '제품·서비스', '고객가치, 경쟁력, 혁신 및 사업 포트폴리오를 진단합니다.', 4),
('OP', '운영·프로세스', '업무 표준화, 병목, 재고, 납기 및 지속적 개선체계를 진단합니다.', 5),
('FI', '재무·수익성', '수익성, 현금흐름, 운전자본 및 재무 대응력을 진단합니다.', 6),
('HR', '조직·인사', '인재, 역량, 평가보상, 협업 및 조직문제의 구조를 진단합니다.', 7),
('LE', '리더십·실행', '의사결정, 실행관리, 정보 피드백 및 조직학습 체계를 진단합니다.', 8),
('DX', '디지털·데이터·AI', '데이터 관리, 시스템 활용, 자동화, AI 활용 및 데이터 기반 의사결정을 진단합니다.', 9)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- ============================================================
-- 2. 설문문항 (27개)
-- ============================================================

INSERT INTO questions (category_id, code, question_text, diagnosis_dimension, display_order)
SELECT c.id, q.code, q.question_text, q.diagnosis_dimension, q.display_order
FROM (VALUES
    ('ST1', 'ST', '우리 회사는 향후 3년간 달성하고자 하는 명확한 성장 방향과 핵심 목표를 가지고 있다.', 'strategy_clarity', 1),
    ('ST2', 'ST', '회사의 경영목표와 핵심 KPI가 부서와 구성원의 업무 목표로 구체적으로 연결되어 있다.', 'goal_alignment', 2),
    ('ST3', 'ST', '시장과 경영환경 변화에 따라 전략과 자원배분 우선순위를 정기적으로 조정하고 있다.', 'strategy_feedback', 3),

    ('CM1', 'CM', '우리 회사는 핵심 고객이 누구이며 고객이 우리 제품·서비스를 선택하는 이유를 명확히 알고 있다.', 'customer_understanding', 4),
    ('CM2', 'CM', '최근 3년간 고객 수, 신규고객, 재구매율 등 주요 고객지표의 변화 추이를 관리하고 있다.', 'customer_trend', 5),
    ('CM3', 'CM', '시장·경쟁사·고객의 변화가 발생하면 이를 제품, 가격, 채널 및 영업전략에 반영하는 체계가 있다.', 'market_response', 6),

    ('MS1', 'MS', '우리 회사는 신규고객 확보와 기존고객 유지·재구매를 위한 구체적인 마케팅·영업 프로세스를 운영하고 있다.', 'growth_engine', 7),
    ('MS2', 'MS', '매출목표 달성을 위해 과도한 할인, 판촉 또는 영업인력의 추가 투입에 의존하지 않고 있다.', 'sales_dependency', 8),
    ('MS3', 'MS', '고객획득비용, 전환율, 재구매율, 고객생애가치 등 주요 마케팅·영업 성과지표를 분석하여 의사결정에 활용한다.', 'marketing_feedback', 9),

    ('PS1', 'PS', '고객이 경쟁사 대신 우리 회사의 제품·서비스를 선택해야 하는 차별적인 가치가 명확하다.', 'value_proposition', 10),
    ('PS2', 'PS', '고객 불만, VOC, 판매데이터 등의 정보가 제품·서비스 개선에 지속적으로 반영된다.', 'learning_loop', 11),
    ('PS3', 'PS', '기존 제품의 매출 감소를 보완할 수 있는 신제품·신서비스 개발과 사업 포트폴리오 관리가 이루어지고 있다.', 'innovation_sustainability', 12),

    ('OP1', 'OP', '핵심 업무, 생산, 물류 및 서비스 프로세스가 표준화되어 특정 인력의 경험과 역량에 과도하게 의존하지 않는다.', 'process_stability', 13),
    ('OP2', 'OP', '재고 증가, 납기 지연, 품질 문제, 업무 적체 등 반복적으로 발생하는 운영상의 문제를 측정하고 관리한다.', 'problem_pattern', 14),
    ('OP3', 'OP', '운영상의 문제가 발생했을 때 단기적인 문제 해결에 그치지 않고 원인을 분석하여 프로세스를 개선한다.', 'structural_improvement', 15),

    ('FI1', 'FI', '매출 증가뿐 아니라 제품·고객·채널별 매출총이익과 영업이익을 정기적으로 분석하고 있다.', 'profitability_management', 16),
    ('FI2', 'FI', '재고, 매출채권, 매입채무 등 운전자본이 현금흐름에 미치는 영향을 측정하고 관리한다.', 'cashflow_structure', 17),
    ('FI3', 'FI', '매출 감소나 비용 증가 등 경영환경 변화가 발생할 경우 향후 손익과 현금흐름을 예측하고 대응할 수 있다.', 'financial_resilience', 18),

    ('HR1', 'HR', '회사의 전략과 성과목표를 달성하는 데 필요한 핵심 인재와 조직역량이 확보되어 있다.', 'organizational_capability', 19),
    ('HR2', 'HR', '평가·보상·승진제도가 구성원의 바람직한 행동과 장기적인 성과 향상을 유도하도록 설계되어 있다.', 'incentive_structure', 20),
    ('HR3', 'HR', '업무량 증가, 핵심인력 의존, 부서 간 갈등 및 직원 이탈 등 조직문제가 반복되는 원인을 파악하고 개선하고 있다.', 'organizational_vicious_cycle', 21),

    ('LE1', 'LE', '중요한 경영문제에 대해 책임자, 실행과제, 일정 및 성과지표를 명확하게 설정한다.', 'execution_structure', 22),
    ('LE2', 'LE', '경영진과 관리자는 현장의 문제와 실패 정보를 신속하게 파악하고 의사결정에 반영한다.', 'information_feedback', 23),
    ('LE3', 'LE', '실행한 정책과 과제의 결과를 점검하고 예상과 다른 결과가 발생하면 원인을 분석하여 전략을 수정한다.', 'adaptive_learning', 24),

    ('DX1', 'DX', '매출, 고객, 재고, 원가, 생산성 등 주요 경영데이터가 정확하게 수집되고 통합적으로 관리되고 있다.', 'data_foundation', 25),
    ('DX2', 'DX', '반복 업무와 의사결정 과정에 ERP, CRM, 협업도구, 자동화 및 AI 기술을 적극적으로 활용하고 있다.', 'digital_utilization', 26),
    ('DX3', 'DX', '데이터 분석 결과가 경영회의, 자원배분 및 현장 업무 개선을 위한 실제 의사결정에 활용된다.', 'data_feedback', 27)
) AS q(code, category_code, question_text, diagnosis_dimension, display_order)
JOIN categories c ON c.code = q.category_code
ON CONFLICT (code) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    diagnosis_dimension = EXCLUDED.diagnosis_dimension,
    display_order = EXCLUDED.display_order;

-- ============================================================
-- 3. 인과관계 지식베이스 샘플
-- ============================================================

INSERT INTO causal_relationships (source_dimension, target_dimension, polarity, delay_exists, relationship_description, confidence_score) VALUES
('sales_dependency', 'profitability_management', '-', TRUE, '할인과 판촉 의존도가 증가하면 일정한 시간 지연 후 수익성이 악화될 가능성이 높다.', 0.80),
('data_foundation', 'problem_pattern', '-', TRUE, '데이터 관리 역량이 낮을수록 운영 문제를 조기에 발견하기 어렵다.', 0.75);

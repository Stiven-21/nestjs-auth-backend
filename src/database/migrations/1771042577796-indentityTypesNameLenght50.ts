import { MigrationInterface, QueryRunner } from "typeorm";

export class IndentityTypesNameLenght501771042577796 implements MigrationInterface {
    name = 'IndentityTypesNameLenght501771042577796'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "identity_types" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "abrev" character varying(5) NOT NULL, CONSTRAINT "UQ_0be8784843b8f3a25b1941f1dab" UNIQUE ("name"), CONSTRAINT "UQ_6f9ef887942c5d4774ac49640a0" UNIQUE ("abrev"), CONSTRAINT "PK_31aaa225433b9b5a86da90147ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_fb3972810c2c77f9b6592deca54" FOREIGN KEY ("identityTypeId") REFERENCES "identity_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_fb3972810c2c77f9b6592deca54"`);
        await queryRunner.query(`DROP TABLE "identity_types"`);
    }

}

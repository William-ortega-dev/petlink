<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class DemoAccountSeedTest extends TestCase
{
    public function test_sql_seed_hashes_match_the_public_demo_credentials(): void
    {
        $projectRoot = dirname(__DIR__, 3);
        $demoMode = file_get_contents($projectRoot.'/frontend/src/demoMode.js');
        $sql = file_get_contents($projectRoot.'/docs/supabase-inicializacion.sql');

        self::assertNotFalse($demoMode, 'Could not read frontend demo credentials.');
        self::assertNotFalse($sql, 'Could not read the PostgreSQL demo seed.');

        $accountPattern = <<<'REGEX'
~(?:(?<quoted_role>'[^']+')|(?<plain_role>[A-Za-z]+)):\s*\{\s*email:\s*'(?<email>[^']+)',\s*password:\s*'(?<password>[^']+)'~
REGEX;
        $seedPattern = <<<'REGEX'
~\('(?<role>[^']+)',\s*'(?<name>[^']+)',\s*'(?<email>[^']+)',\s*'(?<hash>[^']+)'\)~
REGEX;

        preg_match_all($accountPattern, $demoMode, $accounts, PREG_SET_ORDER);
        preg_match_all($seedPattern, $sql, $seedRows, PREG_SET_ORDER);

        self::assertCount(5, $accounts, 'The login form should offer five demo accounts.');

        $seedByEmail = [];
        foreach ($seedRows as $row) {
            $seedByEmail[$row['email']] = ['role' => $row['role'], 'hash' => $row['hash']];
        }

        foreach ($accounts as $account) {
            $role = trim($account['quoted_role'] ?: $account['plain_role'], "'");
            $email = $account['email'];

            self::assertArrayHasKey($email, $seedByEmail, "Missing SQL demo user for {$email}.");
            self::assertSame($role, $seedByEmail[$email]['role'], "Wrong role seeded for {$email}.");
            self::assertTrue(
                password_verify($account['password'], $seedByEmail[$email]['hash']),
                "The SQL password hash does not match the frontend demo password for {$email}.",
            );
        }
    }
}
